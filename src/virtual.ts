/**
 * virtual list core calculating center
 */
import { IdType } from "@/props";

const DIRECTION_TYPE = {
    FRONT: "FRONT", // scroll up or left
    BEHIND: "BEHIND" // scroll down or right
};
const CALC_TYPE = {
    INIT: "INIT",
    FIXED: "FIXED",
    DYNAMIC: "DYNAMIC"
};
const LEADING_BUFFER = 2;

export interface VirtualParam {
    slotHeaderSize: number;
    slotFooterSize: number;
    keeps: number;
    estimateSize: number;
    buffer: number;
    uniqueIds: IdType[];
}

export class Range {
    start = 0;
    end = 0;
    padFront = 0;
    padBehind = 0;
}

export type RangeUpdate = (range: Range) => void;

export class Virtual {
    private param?: VirtualParam;
    private callUpdate?: RangeUpdate;
    private sizes: Map<IdType, number> = new Map<IdType, number>();
    private range = new Range();
    private firstRangeTotalSize = 0;
    private firstRangeAverageSize = 0;
    private lastCalcIndex = 0;
    private fixedSizeValue = 0;
    private calcType = "";
    private _offset = 0;
    private direction = "";

    constructor (param: VirtualParam, callUpdate: RangeUpdate) {
        this.init(param, callUpdate);
    }

    init (param: VirtualParam | undefined, callUpdate: RangeUpdate | undefined) {
        // param data
        this.param = param;
        this.callUpdate = callUpdate;

        // size data
        this.sizes = new Map();
        this.firstRangeTotalSize = 0;
        this.firstRangeAverageSize = 0;
        this.lastCalcIndex = 0;
        this.fixedSizeValue = 0;
        this.calcType = CALC_TYPE.INIT;

        // scroll data
        this._offset = 0;
        this.direction = "";

        // range data
        this.range = Object.create(null);
        if (param) {
            this.checkRange(0, param.keeps - 1);
        }

        // benchmark test data
        // this.__bsearchCalls = 0
        // this.__getIndexOffsetCalls = 0
    }

    destroy () {
        this.init(undefined, undefined);
    }

    // return current render range
    getRange (): Range {
        const result = new Range();
        result.start = this.range.start;
        result.end = this.range.end;
        result.padFront = this.range.padFront;
        result.padBehind = this.range.padBehind;
        return result;
    }

    isBehind (): boolean {
        return this.direction === DIRECTION_TYPE.BEHIND;
    }

    isFront (): boolean {
        return this.direction === DIRECTION_TYPE.FRONT;
    }

    // return start index _offset
    getOffset (start: number): number {
        return (start < 1 ? 0 : this.getIndexOffset(start)) + (this.param?.slotHeaderSize ?? 0);
    }

    updateParam (partial: Partial<VirtualParam>) {
        if (this.param) {
            for (const [key, value] of Object.entries(partial)) {
                if (key in this.param) {
                    if (key === "uniqueIds") {
                        const newIds = value as IdType[];
                        this.sizes.forEach((_, k) => {
                            if (!newIds.includes(k)) {
                                this.sizes.delete(k);
                            }
                        });
                    }
                }
            }
            this.param = { ...this.param, ...partial };
        }
    }

    // save each size map by id
    saveSize (id: IdType, size: number) {
        this.sizes.set(id, size);

        // we assume size type is fixed at the beginning and remember first size value
        // if there is no size value different from this at next comming saving
        // we think it's a fixed size list, otherwise is dynamic size list
        if (this.calcType === CALC_TYPE.INIT) {
            this.fixedSizeValue = size;
            this.calcType = CALC_TYPE.FIXED;
        } else if (this.calcType === CALC_TYPE.FIXED && this.fixedSizeValue !== size) {
            this.calcType = CALC_TYPE.DYNAMIC;
            // it's no use at all
            delete this.fixedSizeValue;
        }

        // calculate the average size only in the first range
        if (this.calcType !== CALC_TYPE.FIXED && typeof this.firstRangeTotalSize !== "undefined") {
            if (this.sizes.size < Math.min(this.param?.keeps ?? Number.MAX_SAFE_INTEGER, this.param?.uniqueIds.length ?? Number.MAX_SAFE_INTEGER)) {
                this.firstRangeTotalSize = [...this.sizes.values()].reduce((acc, val) => acc + val, 0);
                this.firstRangeAverageSize = Math.round(this.firstRangeTotalSize / this.sizes.size);
            } else {
                // it's done using
                delete this.firstRangeTotalSize;
            }
        }
    }

    // in some special situation (e.g. length change) we need to update in a row
    // try going to render next range by a leading buffer according to current direction
    handleDataSourcesChange () {
        let start = this.range.start;

        if (this.isFront()) {
            start = start - LEADING_BUFFER;
        } else if (this.isBehind()) {
            start = start + LEADING_BUFFER;
        }

        start = Math.max(start, 0);

        this.updateRange(this.range.start, this.getEndByStart(start));
    }

    // when slot size change, we also need force update
    handleSlotSizeChange () {
        this.handleDataSourcesChange();
    }

    // calculating range on scroll
    handleScroll (offset: number) {
        this.direction = offset < this._offset ? DIRECTION_TYPE.FRONT : DIRECTION_TYPE.BEHIND;
        this._offset = offset;

        if (!this.param) {
            return;
        }

        if (this.direction === DIRECTION_TYPE.FRONT) {
            this.handleFront();
        } else if (this.direction === DIRECTION_TYPE.BEHIND) {
            this.handleBehind();
        }
    }

    // ----------- public method end -----------

    handleFront () {
        const overs = this.getScrollOvers();
        // should not change range if start doesn't exceed overs
        if (overs > this.range.start) {
            return;
        }

        // move up start by a buffer length, and make sure its safety
        const start = Math.max(overs - (this.param?.buffer ?? 0), 0);
        this.checkRange(start, this.getEndByStart(start));
    }

    handleBehind () {
        const overs = this.getScrollOvers();
        // range should not change if scroll overs within buffer
        if (overs < this.range.start + (this.param?.buffer ?? 0)) {
            return;
        }

        this.checkRange(overs, this.getEndByStart(overs));
    }

    // return the pass overs according to current scroll _offset
    getScrollOvers (): number {
        // if slot header exist, we need subtract its size
        const offset = this._offset - (this.param?.slotHeaderSize ?? 0);
        if (offset <= 0) {
            return 0;
        }

        // if is fixed type, that can be easily
        if (this.isFixedType()) {
            return Math.floor(offset / this.fixedSizeValue);
        }

        let low = 0;
        let middle = 0;
        let middleOffset = 0;
        let high = this.param?.uniqueIds.length ?? 0;

        while (low <= high) {
            // this.__bsearchCalls++
            middle = low + Math.floor((high - low) / 2);
            middleOffset = this.getIndexOffset(middle);

            if (middleOffset === offset) {
                return middle;
            } else if (middleOffset < offset) {
                low = middle + 1;
            } else if (middleOffset > offset) {
                high = middle - 1;
            }
        }

        return low > 0 ? --low : 0;
    }

    // return a scroll _offset from given index, can efficiency be improved more here?
    // although the call frequency is very high, its only a superposition of numbers
    getIndexOffset (givenIndex: number | undefined): number {
        if (!givenIndex) {
            return 0;
        }
        if (!this.param) {
            return 0;
        }

        let offset = 0;
        let indexSize: number | undefined = 0;
        for (let index = 0; index < givenIndex; index++) {
            // this.__getIndexOffsetCalls++
            indexSize = this.sizes.get(this.param.uniqueIds[index]);
            offset = offset + (typeof indexSize === "number" ? indexSize : this.getEstimateSize());
        }

        // remember last calculate index
        this.lastCalcIndex = Math.max(this.lastCalcIndex, givenIndex - 1);
        this.lastCalcIndex = Math.min(this.lastCalcIndex, this.getLastIndex());

        return offset;
    }

    // is fixed size type
    isFixedType (): boolean {
        return this.calcType === CALC_TYPE.FIXED;
    }

    // return the real last index
    getLastIndex (): number {
        return (this.param?.uniqueIds.length ?? 0) - 1;
    }

    // in some conditions range is broke, we need correct it
    // and then decide whether need update to next range
    checkRange (start: number, end: number) {
        const keeps = this.param?.keeps ?? 0;
        const total = this.param?.uniqueIds.length ?? 0;

        // datas less than keeps, render all
        if (total <= keeps) {
            start = 0;
            end = this.getLastIndex();
        } else if (end - start < keeps - 1) {
            // if range length is less than keeps, correct it base on end
            start = end - keeps + 1;
        }

        if (this.range.start !== start) {
            this.updateRange(start, end);
        }
    }

    // setting to a new range and rerender
    updateRange (start: number, end: number) {
        this.range.start = start;
        this.range.end = end;
        this.range.padFront = this.getPadFront();
        this.range.padBehind = this.getPadBehind();
        if (this.callUpdate) {
            this.callUpdate(this.getRange());
        }
    }

    // return end base on start
    getEndByStart (start: number): number {
        const theoryEnd = start + (this.param?.keeps ?? 0) - 1;
        return Math.min(theoryEnd, this.getLastIndex());
    }

    // return total front _offset
    getPadFront () {
        if (this.isFixedType()) {
            return this.fixedSizeValue * this.range.start;
        } else {
            return this.getIndexOffset(this.range.start);
        }
    }

    // return total behind _offset
    getPadBehind () {
        const end = this.range.end;
        const lastIndex = this.getLastIndex();

        if (this.isFixedType()) {
            return (lastIndex - end) * this.fixedSizeValue;
        }

        // if it's all calculated, return the exactly _offset
        if (this.lastCalcIndex === lastIndex) {
            return this.getIndexOffset(lastIndex) - this.getIndexOffset(end);
        } else {
            // if not, use a estimated value
            return (lastIndex - end) * this.getEstimateSize();
        }
    }

    // get the item estimate size
    getEstimateSize () {
        return this.isFixedType() ? this.fixedSizeValue : (this.firstRangeAverageSize || (this.param?.estimateSize ?? 0));
    }

    get offset (): number {
        return this._offset;
    }
}
