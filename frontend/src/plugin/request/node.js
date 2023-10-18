import axios from "axios";
export class nodeRequest {
    static async getNodeValue(id) {
        return await axios({
            //请求类型
            method: "GET",
            //URL
            url: "http://localhost:8000/api/getValues",
            //参数
            params: {
                dataset: localStorage.getItem("DATATYPE"),
                id
            },
        })
    }
}