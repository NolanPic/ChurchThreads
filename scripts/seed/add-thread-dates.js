const fs = require('fs');
const path = require('path');

// Generate array of dates
function generateDates(count) {
  const dates = [];
  let currentDate = Date.now(); // Start with today
  
  dates.push(currentDate);
  
  // Generate remaining dates by subtracting random time intervals
  for (let i = 1; i < count; i++) {
    // Random hours: 1-48 hours
    const randomHours = Math.floor(Math.random() * 48) + 1;
    // Random days: 0-10 days
    const randomDays = Math.floor(Math.random() * 11);
    
    // Calculate total milliseconds to subtract
    const hoursInMs = randomHours * 60 * 60 * 1000;
    const daysInMs = randomDays * 24 * 60 * 60 * 1000;
    const totalSubtract = hoursInMs + daysInMs;
    
    currentDate = currentDate - totalSubtract;
    dates.push(currentDate);
  }
  
  // Reverse array so newest date is at the end
  return dates.reverse();
}

// Read the seed data file
const seedDataPath = path.join(__dirname, 'seed-data.json');
const seedData = JSON.parse(fs.readFileSync(seedDataPath, 'utf8'));

// Add postedAt property to each thread
seedData.organizations.forEach((org) => {
  console.log(`Processing ${org.orgName} (${org.threads.length} threads)`);

  // group threads by feed
  const threadsByFeed = org.threads.reduce((acc, thread) => {
    acc[thread.feedIndex] = acc[thread.feedIndex] || [];
    acc[thread.feedIndex].push(thread);
    return acc;
  }, []);

  // Generate dates for threads in each feed
  threadsByFeed.forEach((threads) => {
    const dates = generateDates(threads.length);
    console.log(`  Generated ${dates.length} dates for ${org.orgName}`);
    console.log(`  Date range: ${new Date(dates[0]).toISOString()} to ${new Date(dates[dates.length - 1]).toISOString()}`);
    threads.forEach((thread, threadIndex) => {
      thread.postedAt = dates[threadIndex];
    });
  });

});

// Write the updated data back to the file
fs.writeFileSync(seedDataPath, JSON.stringify(seedData, null, 2), 'utf8');

console.log(`\nSuccessfully added postedAt property to all threads!`);
console.log(`Updated data written to ${seedDataPath}`); 