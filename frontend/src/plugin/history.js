export default {
    reverseEdge(record, operation) {
        let index = record.findIndex(history => {
            if (history.source === operation.target && history.target === operation.source && history.reverse) {
                return true;
            } else return false;
        })

        if (index < 0) {
            record.push({
                source: operation.source,
                target: operation.target,
                reverse: true
            });
        }
        else
            record.splice(index, 1);
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
    }
}