// Test if API returns data
fetch('http://localhost:3000/api/items')
  .then(res => res.json())
  .then(result => {
    console.log('API Result:', result);
    const activities = result.data || [];
    console.log('Activities count:', activities.length);
    if (activities.length > 0) {
      console.log('First activity:', activities[0]);
    }
  })
  .catch(err => console.error('API Error:', err));
