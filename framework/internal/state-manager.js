export class StateManager {
    _buckets = [];
    _currentBucketIndex = -1;
    _currentStateIndex = -1;

    get currentBucket() {
        return this._buckets[this._currentBucketIndex];
    }

    get currentStateIndex() {
        return ++this._currentStateIndex;
    }

    reset() {
        this._currentBucketIndex = -1;
        this._currentStateIndex = -1;
    }

    loadBucket(tag, level) {
        this._currentStateIndex = -1;
        this._currentBucketIndex++;

        const bucket = this.currentBucket;

        if (!bucket || bucket.level < level) {
            this._allocateBucket(tag, level);
            return;
        }

        if (bucket.tag === tag && bucket.level === level) {
            return;
        }

        this._trimCurrentLevel();
        this._allocateBucket(tag, level);
    }

    cleanBucket() {
        this.currentBucket.states = [];

        const nextBucket = this._buckets[this._currentBucketIndex + 1];

        if (nextBucket && nextBucket.level > this.currentBucket.level) {
            this._currentBucketIndex++;
            this._trimCurrentLevel();
            this._currentBucketIndex--;
        }
    }

    _allocateBucket(tag, level) {
        if (level < 0) {
            throw new RangeError('Invalid level')
        }

        const newState = {tag, level};
        this._buckets.splice(this._currentBucketIndex, 0, newState);
    }

    _trimCurrentLevel() {
        const level = this.currentBucket.level;

        let index = this._currentBucketIndex;
        let current = this._buckets[index];

        while (current.level >= level) {
            current = this._buckets[++index];
        }
        this._buckets.splice(this._currentBucketIndex, index - this._currentBucketIndex);
    }
}