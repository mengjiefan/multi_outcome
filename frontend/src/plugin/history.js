export default {
    reverseEdge(record, operation) {
        let index = record.findIndex(history => {
            if (history.source === operation.source && history.target === operation.target && history.reverse) {
                return true;
            } else return false;
        })
        if (index > -1) return;//不要重复reverse记录
        index = record.findIndex(history => {
            if (history.source === operation.target && history.target === operation.source && history.reverse) {
                return true;
            } else return false;
        })
        console.log(index)
        if (index < 0) {
            record.push({
                source: operation.source,
                target: operation.target,
                reverse: true
            });
        }
        else
            record.splice(index, 1);
        console.log(record)
    },
    deleteEdge(record, operation) {
        let newRecord = record.filter(history => {
            let flag = false;
            if (history.source === operation.source && history.target === operation.target) flag = true;
            else if (history.target === operation.source && history.source === operation.target) flag = true;
            return !flag;
        });
        newRecord.push({
            source: operation.source,
            target: operation.target,
            hidden: true
        })
        return newRecord;
    },
    reDoHistory(data) {
        let record = data.history;
        record.forEach(history => {
            let index = data.linksList.findIndex(link => {
                if (link.source === history.source && link.target === history.target) {
                    return true;
                }
                if (link.source === history.target && link.target === history.source && history.hidden) {
                    return true;
                }
            })
            if (index > -1) {
                if (history.reverse) {
                    let value = data.linksList[index].value;
                    data.linksList.splice(index, 1, {
                        source: history.target,
                        target: history.source,
                        value: value
                    });
                } else {
                    data.linksList.splice(index, 1);
                }
            }
        })
    },
    combineHistory(records) {
        let resrecord = [];
        records.forEach(record => {
            resrecord = resrecord.concat(record);
        })
        console.log(resrecord);
        let flag = true;

        while (flag) {
            flag = false;
            let index = resrecord.findIndex(record => {
                if (record.hidden) return true;
                else return false;
            })
            if (index > -1) {
                flag = true;
                let record = resrecord[index];
                resrecord = resrecord.filter(historyy =>
                    !(historyy.source === record.source && historyy.target === record.target)
                    && !(historyy.target === record.source && historyy.source === record.target))
            }
        }
        flag = true;
        let newRecord = [];
        while (flag) {
            flag = false;
            let index = resrecord.findIndex(record => {
                if (record.reverse) return true;
                else return false;
            })
            if (index > -1) {
                flag = true;
                let record = resrecord[index];
                let rnum = 0;
                let lnum = 0;
                resrecord.forEach(history => {
                    if (history.source === record.source && history.target === record.target && history.reverse)
                        rnum++;
                    else if (history.target === record.source && history.source === record.target && history.reverse)
                        lnum++;
                })
                resrecord = resrecord.filter(historyy => {
                    !(historyy.source === record.source && historyy.target === record.target)
                        && !(historyy.target === record.source && historyy.source === record.target)
                })
                if (rnum > 0) {
                    newRecord.push(record);
                } else {
                    newRecord.push({
                        source: record.target,
                        target: record.source,
                        reverse: true
                    })
                }
            }
        }
        resrecord = resrecord.concat(newRecord);
        return resrecord;
    },
}