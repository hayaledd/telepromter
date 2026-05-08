const https = require('https');

https.get('https://api.github.com/repos/hayaledd/telepromter/actions/runs', { headers: { 'User-Agent': 'node.js' } }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const runs = JSON.parse(data).workflow_runs;
    if(!runs || runs.length === 0) return console.log("No runs found");
    const latest = runs[0];
    console.log(`Latest Run: ${latest.name} - ${latest.status} - ${latest.conclusion}`);
    
    https.get(latest.jobs_url, { headers: { 'User-Agent': 'node.js' } }, (res2) => {
      let data2 = '';
      res2.on('data', chunk => data2 += chunk);
      res2.on('end', () => {
        const jobs = JSON.parse(data2).jobs;
        const failedSteps = jobs.map(j => ({
            name: j.name, 
            failed_steps: j.steps.filter(s => s.conclusion === 'failure')
        }));
        console.log(JSON.stringify(failedSteps, null, 2));
      });
    });
  });
});
