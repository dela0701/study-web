import {expect} from "chai";

import {Times} from "../../src/assets/js/common/common";

describe('test "Times" object in common module', function () {
    describe('times class', function () {
        it('should "nowString" function returned current time as string', function () {

            expect(/\d{4}年\d{2}月\d{2}日\s\d{2}:\d{2}:\d{2}/.test(Times.nowString())).to.be.true;
        });
    })
});