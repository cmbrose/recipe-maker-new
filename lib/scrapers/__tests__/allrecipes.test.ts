import { scrapeAllRecipes } from '../allrecipes';
import { runScraperTests, commonErrorCases } from './test-utils';
import { classicDinnerRollsData, miniBrownieTurkeysData } from './allrecipes-test-data';

// Run the generic test suite for AllRecipes scraper
runScraperTests({
  scraperName: 'allrecipes',
  scraperFunction: scrapeAllRecipes,
  testCases: [
    {
      name: 'Classic Dinner Rolls',
      htmlFile: 'classic-dinner-rolls.html',
      expected: classicDinnerRollsData
    },
    {
      name: 'Mini Brownie Turkeys',
      htmlFile: 'mini-brownie-turkeys.html',
      expected: miniBrownieTurkeysData
    }
  ],
  errorCases: [
    commonErrorCases.missingName
  ]
});
