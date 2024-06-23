import data from "@/assets/data/data.json";
const allData = data.data;
export const getFactorsOfDataset = (dataset) => {
  return allData[dataset].factors;
};
export const getOutcomesOfDataset = (dataset) => {
  return allData[dataset].outcomes;
};
export const getIndexOfDataset = (dataset) => {
  return allData[dataset].index;
};
