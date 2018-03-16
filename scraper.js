require('dotenv').config();
require('isomorphic-fetch');
const cheerio = require('cheerio');
const redis = require('redis');
const util = require('util');

const redisOptions = {
  url: 'redis://127.0.0.1:6379/0'
};

const client = redis.createClient(redisOptions);

const cacheTimeToLive = 10000000;

const asyncGet = util.promisify(client.get).bind(client);
const asyncSet = util.promisify(client.set).bind(client);
const asyncflush = util.promisify(client.flushall).bind(client);



/* todo require og stilla dót */



/**
 * Listi af sviðum með „slug“ fyrir vefþjónustu og viðbættum upplýsingum til
 * að geta sótt gögn.
 */
const departments = [
  {
    name: 'Félagsvísindasvið',
    slug: 'felagsvisindasvid',
  },
  {
    name: 'Heilbrigðisvísindasvið',
    slug: 'heilbrigdisvisindasvid',
  },
  {
    name: 'Hugvísindasvið',
    slug: 'hugvisindasvid',
  },
  {
    name: 'Menntavísindasvið',
    slug: 'menntavisindasvid',
  },
  {
    name: 'Verkfræði- og náttúruvísindasvið',
    slug: 'verkfraedi-og-natturuvisindasvid',
  },
];

async function get(url, cacheKey) {
  const cached = await asyncGet(cacheKey);

  if(cached){
    return cached
  }

  const response = await fetch(url);
  const text = await response.text();

  await asyncSet(cacheKey, text, 'EX', cacheTimeToLive);

  return text;
}

/**
 * Sækir svið eftir `slug`. Fáum gögn annaðhvort beint frá vef eða úr cache.
 *
 * @param {string} slug - Slug fyrir svið sem skal sækja
 * @returns {Promise} Promise sem mun innihalda gögn fyrir svið eða null ef það finnst ekki
 */
async function getTests(slug) {
  /* todo */
  let i = 0;
  for (i = 0; i < departments.length; i++) {
    if(departments[i].slug === slug){
      //console.log(i);
      break;
    }
  }
  const response = await get('https://ugla.hi.is/Proftafla/View/ajax.php?sid=2027&a=getProfSvids&proftaflaID=37&svidID='
   + (i+1) + '&notaVinnuToflu=0', slug);

  //console.log(response);

  const $ = cheerio.load(JSON.parse(response).html, {
    normalizeWhitespace: true,
    xmlMode: true,
});



    const tablesdata = $('.box h3');

  //console.log(tablesdata.text());

    const tables = [];



    tablesdata.each((i, el) => {
    let title = null;
    title = $(el).next();
    //console.log(title);
    const tafla = $(title).find('tbody');

    const tafladata = [];

    tafla.children().each((j,row) => {
      const taflael = $(row).children();
      tafladata.push({
        course: $(taflael[0]).text(),
        name: $(taflael[1]).text(),
        type: $(taflael[2]).text(),
        students: $(taflael[3]).text(),
        date: $(taflael[4]).text(),
        });
    });
    tables.push({
      header: tablesdata.text().trim(),
      tests: tafladata,
    });
  });

  return tables;

  // console.log(table);
  // client.quit();
}

/**
 * Hreinsar cache.
 *
 * @returns {Promise} Promise sem mun innihalda boolean um hvort cache hafi verið hreinsað eða ekki.
 */
async function clearCache() {
  /* todo */
  asyncFlush();

}

/**
 * Sækir tölfræði fyrir öll próf allra deilda allra sviða.
 *
 * @returns {Promise} Promise sem mun innihalda object með tölfræði um próf
 */
async function getStats() {
  /* todo */

}

module.exports = {
  departments,
  getTests,
  clearCache,
  getStats,
};
