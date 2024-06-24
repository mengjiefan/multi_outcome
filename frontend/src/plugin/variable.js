import axios from "axios";

export const getFactorsOfDataset = async (dataset) => {
  try {
    let response = await axios({
      method: "GET",
      url: "http://localhost:8000/api/get_factors",
      params: {
        dataset,
      },
    });
    return response.data.factors;
  } catch (error) {
    console.log("请求失败了", error);
  }
};
export const getOutcomesOfDataset = async (dataset) => {
  try {
    let response = await axios({
      method: "GET",
      url: "http://localhost:8000/api/get_outcomes",
      params: {
        dataset,
      },
    });
    return response.data.outcomes;
  } catch (error) {
    console.log("请求失败了", error);
  }
};
export const getIndexOfDataset = async (dataset) => {
  try {
    let response = await axios({
      method: "GET",
      url: "http://localhost:8000/api/get_index",
      params: {
        dataset,
      },
    });
    return response.data.index;
  } catch (error) {
    console.log("请求失败了", error);
  }
};
