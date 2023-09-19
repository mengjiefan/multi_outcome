import axios from "axios";
export class linkRequest {

    static async getLinkValue(source, target) {
        return await axios({
            //请求类型
            method: "GET",
            //URL
            url: "http://localhost:8000/api/recaculate_Links",
            //参数
            params: {
                dataset: localStorage.getItem("DATATYPE"),
                source: source,
                target: target,
            },
        })
    }
}