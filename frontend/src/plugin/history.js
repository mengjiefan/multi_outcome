import { findLink } from "@/plugin/links";
export default {
  reverseEdge(record, operation) {
    let index = record.findIndex((history) => {
      if (
        history.source === operation.source &&
        history.target === operation.target &&
        history.reverse
      ) {
        return true;
      } else return false;
    });
    if (index > -1) return; //不重复添加
    index = record.findIndex((history) => {
      if (
        history.source === operation.target &&
        history.target === operation.source &&
        history.reverse
      ) {
        return true;
      } else return false;
    });
    if (index < 0) {
      record.push({
        source: operation.source,
        target: operation.target,
        value: operation.value,
        reverse: true,
      });
    } else record.splice(index, 1);
  },
  deleteEdge(record, operation) {
    //把add和reverse都去除
    let newRecord = record.filter((history) => {
      let flag = false;
      if (
        history.source === operation.source &&
        history.target === operation.target
      )
        flag = true;
      else if (
        history.target === operation.source &&
        history.source === operation.target
      )
        flag = true;
      return !flag;
    });
    newRecord.push({
      source: operation.source,
      target: operation.target,
      hidden: true,
    });
    return newRecord;
  },
  addEdge(record, operation) {
    let newRecord = record.filter((history) => {
      let flag = false;
      if (
        history.source === operation.source &&
        history.target === operation.target &&
        operation.hidden
      )
        flag = true;
      else if (
        history.target === operation.source &&
        history.source === operation.target &&
        operation.hidden
      )
        flag = true;
      return !flag;
    });
    newRecord.push({
      source: operation.source,
      target: operation.target,
      value: operation.value,
      add: true,
    });
    return newRecord;
  },
  reDoHistory(data) {
    let record = data.history;
    if (!record) return;
    record.forEach((history) => {
      let index = findLink.showReverseLink(history, data.linksList);
      let allIndex = findLink.sameNodeLink(history, data.linksList);
      console.log(index);
      if (history.hidden && allIndex > -1)
        data.linksList.splice(allIndex, 1); //delete
      else if (history.reverse && index > -1)
        data.linksList.splice(index, 1, {
          source: history.target,
          target: history.source,
          value: history.value,
        });
      //reverse
      else if (history.add && allIndex < 0) {
        let sIndex = data.nodesList.findIndex(
          (node) => node.id === history.source
        );
        let tIndex = data.nodesList.findIndex(
          (node) => node.id === history.target
        );

        if (sIndex > -1 && tIndex > -1)
          data.linksList.push({
            source: history.source,
            target: history.target,
            value: history.value,
          });
      } //add
    });
  },
  getRelevantRecord(records, record) {
    return records.filter(
      (history) =>
        (history.source === record.source &&
          history.target === record.target) ||
        (history.target === record.source && history.source === record.target)
    );
  },
  getIdleRecord(records, record) {
    return records.filter((historyy) => {
      !(
        historyy.source === record.source && historyy.target === record.target
      ) &&
        !(
          historyy.target === record.source && historyy.source === record.target
        );
    });
  },
  combineHistory(records) {
    let resrecord = [];
    records.forEach((record) => {
      resrecord = resrecord.concat(record);
    });
    let flag = true;
    let changeRecords = [];
    while (flag) {
      flag = false;
      let index = resrecord.findIndex((record) => {
        if (record.hidden) return true;
        else return false;
      });
      if (index > -1) {
        flag = true;
        let record = resrecord[index];
        let relevantRecords = this.getRelevantRecord(resrecord, record);
        let addRecords = relevantRecords.filter((history) => history.add);
        let hidRecords = relevantRecords.filter((history) => history.hidden);
        let idleRecords = this.getIdleRecord(resrecord, record); //删除所有相关操作

        if (addRecords.length > hidRecords.length) {
          resrecord = idleRecords.concat(
            relevantRecords.filter((history) => history.reverse)
          ); //无关操作+翻转操作
          changeRecords.push(addRecords[0]);
        } else if (addRecords.length < hidRecords.length) {
          changeRecords.push(hidRecords[0]);
          resrecord = idleRecords; //无关操作
        } //删增相等
        else
          resrecord = idleRecords.concat(
            relevantRecords.filter((history) => history.reverse)
          ); //无关操作+翻转操作
      }
    }
    resrecord = resrecord.concat(changeRecords);
    flag = true;
    let newRecord = [];
    while (flag) {
      flag = false;
      let index = resrecord.findIndex((record) => {
        if (record.reverse) return true;
        else return false;
      });
      if (index > -1) {
        flag = true;
        let record = resrecord[index];
        let rnum = 0;
        resrecord.forEach((history) => {
          if (
            history.source === record.source &&
            history.target === record.target &&
            history.reverse
          )
            rnum++;
          else if (
            history.target === record.source &&
            history.source === record.target &&
            history.reverse
          )
            rnum--;
        });
        resrecord = resrecord.filter((historyy) => {
          !(
            historyy.source === record.source &&
            historyy.target === record.target
          ) &&
            !(
              historyy.target === record.source &&
              historyy.source === record.target
            );
        });
        if (rnum > 0) {
          newRecord.push(record);
        } else {
          newRecord.push({
            source: record.target,
            target: record.source,
            reverse: true,
          });
        }
      }
    }
    resrecord = resrecord.concat(newRecord);
    return resrecord;
  },
};
