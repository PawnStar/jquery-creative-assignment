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

 // Helper function that does fetch -> json
const getJSON = async url=>{
  const response = await fetch(url);
  return await response.json();
}

const getUserLocation = async ()=>{
  const location = await getJSON(`http://api.ipstack.com/check?access_key=${LOCATION_API_KEY}`);

  return [
    ...location.city.split(' '),
    ...location.region_name.split(' ')
  ]
}

// Get all the papers published in location
const getPapers = async location=>{
  const data = await getJSON(`https://chroniclingamerica.loc.gov/search/titles/results/?terms=${location.join('+')}&format=json`);

  // Make sure it was in that city, not just having the city in the title
  let papers = data.items.filter(paper=>{
    let pub = paper.place_of_publication.toLowerCase();
    for(let component of location)
      if(!pub.includes(component.toLowerCase()))
        return false;
    return true;
  })

  if(!papers.length)
    throw new Error('No newspapers found in ' + location.join(' ') + ' - perhaps try a larger city?');

  return papers;
}

// Transform array of papers into promises retrieving all the issues of that paper available
// wait on those promises and return array of populated papers
const populateIssues = papers=>Promise.all(papers.map(paper=>getJSON(paper.url.replace('http://', 'https://'))))

// Filter for papers with issues on current day
const filterToday = async papers=>{
  // Filter issues that happened on this day
  let date = '-' + ((new Date()).getMonth() + 1 + '').padStart(2, '0') + '-' + ((new Date()).getDate() + '').padStart(2, '0');
  console.log('filtering by ' + date);
  papers.map(paper=>{
    paper.issues = paper.issues.filter(issue=>issue.date_issued.includes(date))
    return paper
  })

  papers = papers.filter(paper=>paper.issues.length > 0)

  if(!papers.length)
    throw new Error('No publications found on that day - perhaps try a larger city?');

  return papers;
}

// Randomly select an issue from the papers/issues passed in
const getRandomIssue = async (papers)=>{
  // Randomly select newspaper
  let newspaper = papers[Math.floor(Math.random()*papers.length)]

  // Randomly select issue
  let issue = newspaper.issues[Math.floor(Math.random()*newspaper.issues.length)]

  return issue;
}

const getIssueFrontPage = async issue=>{
  const issueData = await getJSON(issue.url.replace('http://', 'https://'));
  const pageURL = issueData.pages[0].url;
  const pageData = await getJSON(issueData.pages[0].url.replace('http://', 'https://'));

  // Make reverse-engineered image links
  pageData.image = pageURL.replace('.json', '/image_600x800_from_0,0_to_7468,10468.jpg');

  // Make html page link
  pageData.htmlPage = pageURL.replace('.json', '');

  return pageData;
}