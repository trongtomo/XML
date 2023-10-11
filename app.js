const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const path = require("path");
const cheerio = require("cheerio");
const axios = require("axios");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Define the root route
app.get("/", async (req, res) => {
  // Retrieve data from Wikipedia and CIA Factbook
  const wikipediaData = await scrapeWikipediaData();
  const ciaData = await scrapeCIAWorldFactbookData();
  // Render the index.ejs view and pass the data as variables
  res.render("index", { wikipediaData, ciaData });
});

// Define the /integrated-data route
//integrate for data json page
app.get("/integrate-data", async (req, res) => {
  const wikipediaData = await scrapeWikipediaData();
  const ciaData = await scrapeCIAWorldFactbookData();

  const integratedData = combineData(wikipediaData, ciaData);
  res.json(integratedData); // Return the integrated data as JSON
});

// Example function to combine data
function combineData(wikipediaData, ciaData) {
  const integratedData = [];

  wikipediaData.forEach((wikipediaCountry) => {
    const matchingCIAData = ciaData.find(
      (ciaCountry) => ciaCountry.name === wikipediaCountry.country
    );

    if (matchingCIAData) {
      // Combine data
      integratedData.push({
        name: matchingCIAData.name,
        population: matchingCIAData.population,
        capital: matchingCIAData.capital,
        language: matchingCIAData.language,
      });
    }
  });

  return integratedData;
}
app.get("/integrated-data", async (req, res) => {
  const wikipediaData = await scrapeWikipediaData();
  const ciaData = await scrapeCIAWorldFactbookData();
  const integratedData = combineData(wikipediaData, ciaData);
  res.render("integrated-data", { integratedData });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Scrape and process data Fuction
async function scrapeWikipediaData() {
  try {
    const response = await axios.get(
      "https://en.wikipedia.org/wiki/List_of_national_capitals_by_population"
    );

    // Implement your data extraction logic here
    const data = processDataFromWikipedia(response.data);
    return data;
  } catch (error) {
    console.error("Error scraping data from Wikipedia:", error);
    return [];
  }
}
// Define a function to process data from Wikipedia (example implementation)
function processDataFromWikipedia(html) {
  const $ = cheerio.load(html);

  const extractedData = [];

  // Assuming the table structure is like this, you would need to adapt it to your specific page structure:
  $("table.wikitable tbody tr")
    .slice(1, 6)
    .each((index, element) => {
      // Get the top 5 populous countries
      const $row = $(element);
      const $columns = $row.find("td");

      // Extract data from columns
      const country = $columns.eq(0).text().trim();
      const population = $columns.eq(2).text().trim();
      const capital = $columns.eq(4).text().trim();
      const language = $columns.eq(5).text().trim();

      // Add the extracted data to the array
      extractedData.push({ country, population, capital, language });
    });

  return extractedData;
}

// Define a function to scrape data from the CIA World Factbook
async function scrapeCIAWorldFactbookData(countryName) {
  try {
    const response = await axios.get(
      `https://www.cia.gov/the-world-factbook/countries/${countryName}`
    );
    // Implement your data extraction logic here
    const data = processDataFromCIAWorldFactbook(response.data);
    return data;
  } catch (error) {
    console.error("Error scraping data from CIA World Factbook:", error);
    return [];
  }
}

function processDataFromCIAWorldFactbook(html) {
    const $ = cheerio.load(html);
  
    // Select all country elements
    const countryElements = $("h2.mt30 a.inline-link");
  
    // Extract data for each country
    const extractedData = countryElements.map((index, element) => {
      const countryName = $(element).text();
      const countryLink = $(element).attr("href");
  
      return {
        name: countryName,
        link: `https://www.cia.gov${countryLink}`,
      };
    }).get(); // Convert to an array
  
    return extractedData;
  }
