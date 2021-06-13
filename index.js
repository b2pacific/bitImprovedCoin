const fs = require("fs");
const parse = require("csv-parser");

let csvData = [];
let count = 0;

fs.createReadStream("mempool.csv")
  .pipe(parse())
  .on("data", (row) => {

    // Storing all the transactions in csvData
    csvData.push(row);
    count++;
  })
  .on("end", () => {
    console.log("Total transactions ", count);

    // Sorting the array based on the fee value
    csvData.sort(function (a, b) {
      return b.fee - a.fee;
    });

    let weight = 0,
      i = 0,
      fee = 0;
    let newSet = new Set();
    let answer = [];

    let flag = false;

    while (true) {

      // Checking if the value was already processed or not
      if (!newSet.has(csvData[i].tx_id)) {

        // Checking if the transactions has parent transactions or not
        if (csvData[i]["parents "].length > 0) {
          newSet.add(csvData[i].tx_id);

          // Getting all the parent transactions
          const parents = csvData[i]["parents "].split(";");

          // Processing all of them one by one
          for (let j = 0; j < parents.length; ++j) {
            newSet.add(parents[j]);

            // Getting the object of the parent transaction from the array
            const parent = csvData.find((value, index) => {
              return value == parents[j];
            });

            if (parent) {

              // Checking if the value exceeds the maximum block weight
              if (weight + parseInt(parent.weight, 10) >= 4000000) {
                flag = true;
                break;
              }

              answer.push(parent.tx_id);
              weight += parseInt(parent.weight, 10);
              fee += parseInt(parent.fee, 10);
            }
          }

          if (flag == true) {
            break;
          }

          // Checking if the value exceeds the maximum block weight
          if (weight + parseInt(csvData[i].weight, 10) >= 4000000) {
            flag = true;
            break;
          }

          answer.push(csvData[i].tx_id);

          weight += parseInt(csvData[i].weight, 10);

          fee += parseInt(csvData[i].fee, 10);
        } else {
          newSet.add(csvData[i].tx_id);
          weight += parseInt(csvData[i].weight, 10);
          fee += parseInt(csvData[i].fee, 10);
          answer.push(csvData[i].tx_id);
        }
      }
      i++;
    }

    // Writing the answer array to the block.txt file
    const outputFile = fs.createWriteStream("block.txt");
    for (let i = 0; i < answer.length; ++i) {
      outputFile.write(`${answer[i]}\n`);
    }

    // Printing the total fee calculated and the number of transactions in the block
    console.log("Total Fee ", fee);
    console.log("Transactions in Block ", answer.length);
  });
