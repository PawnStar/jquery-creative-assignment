const LOCATION_API_KEY = 'b920938457a097523b487e967894099a';

/**
 * This file has a series of async functions (yeah, with
 * promises - those things I think you should have covered
 * instead of jQuery) that retrieve information from the
 * APIs I've chosen to use for this assignment.
 * 
 * None of these functions are to do with DOM manipulation,
 * all that is in a different file.
 */

const getJSON = async url=>{
  const response = await fetch(url);
  return await response.json();
}

const getUserLocation = async ()=>{
  const data = await getJSON(`http://api.ipstack.com/check?access_key=${LOCATION_API_KEY}`);

  return data.city;
}

const getNewspapers = async city=>{
  const data = await getJSON(`https://chroniclingamerica.loc.gov/suggest/titles/?q=${city}`);

  let papers = data[1].map((name, index)=>({
    name,
    id: data[2][index],
    url: data[3][index]
  }));

  papers = await Promise.all(papers.map(async paper=>{
    return await getDataForNewspaper(paper.id);
  }))

  return papers;
}

getDataForNewspaper = async newspaperID=>{
  return await getJSON(`https://chroniclingamerica.loc.gov/lccn/${newspaperID}.json`);
}

const getIssuesForNewspaper = async newspaperID=>{
  const data = await getDataForNewspaper(newspaperID);

  return data.issues;
}

const getIssueFrontPage = async issue=>{
  const issueData = await getJSON(issue.url);
  const pageURL = issueData.pages[0].url;
  const pageData = await getJSON(issueData.pages[0].url);
  pageData.images = {
    preview: pageURL.replace('.json', '/image_600x800_from_0,0_to_7468,10468.jpg'),
    large: pageURL.replace('.json', '/image_1920x1080_from_0,0_to_7468,10468.jpg')
  }
}