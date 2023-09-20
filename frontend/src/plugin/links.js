export class findLink {
    static showSameDireLink(link, linksList) {
        let index = linksList.findIndex(item => {
            if (item.source === link.source && item.target === link.target && !item.reverse) return true;
            else if (item.target === link.source && item.source === link.target && item.reverse) return true;
            else return false;
        })
        return index
    }
    static sameNodeLink(link, linksList) {
        let index = linksList.findIndex(item => {
            if (item.source === link.source && item.target === link.target) return true;
            else if (item.target === link.source && item.source === link.target) return true;
            else return false;
        })
        return index;
    }
    static showReverseLink(link, linksList) {
        let index = linksList.findIndex(item => {
            if (item.source === link.source && item.target === link.target && item.reverse) return true;
            else if (item.target === link.source && item.source === link.target && !item.reverse) return true;
            else return false;
        })
        return index
    }
    
}