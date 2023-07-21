export default transormIntoPos = (path) => {
    path.splice(0, 1);
    let vertices = path.split("L");
    start = vertices[0].split(',');
    let posList = [];
    let startPos = {
        x: numFilter(start[0]),
        y: numFilter(start[1]),
    };
    posList.push(startPos);
    for (let i = 1; i < vertices.length; i++) {
        let vertice = vertices[i];
        let pos = vertice.split(',');
        let node = {
            x: numFilter(pos[0]),
            y: numFilter(pos[1])
        }
        posList.push(node)
    };
    return posList;
}
const numFilter = (num) => {
    return parseFloat(num).toFixed(0)
} 