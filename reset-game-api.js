// Reset Game Data API Script
// Run this with: node reset-game-api.js
// This script uses the API endpoints to reset game data

const BASE_URL = 'http://localhost:3000'; // Change to your server URL

async function resetGameData() {
  try {
    console.log('Starting game data reset...');

    // Get all teams first
    const teamsResponse = await fetch(`${BASE_URL}/api/teams`);
    if (!teamsResponse.ok) {
      console.error('Failed to fetch teams');
      return;
    }

    const teamsData = await teamsResponse.json();
    const teams = teamsData.teams || [];

    console.log(`Found ${teams.length} teams to reset`);

    // Reset each team
    for (const team of teams) {
      console.log(`Resetting team ${team.team_number}...`);
      
      // Reset team data (score, budget, members)
      const resetResponse = await fetch(`${BASE_URL}/api/teams/${team.team_number}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: 0,
          budget: 1000,
          members: []
        })
      });

      if (resetResponse.ok) {
        console.log(`✓ Team ${team.team_number} reset successfully`);
      } else {
        console.error(`✗ Failed to reset team ${team.team_number}`);
      }
    }

    console.log('Game data reset completed!');
    console.log('Note: You may need to run the SQL script for hint_purchases table cleanup');

  } catch (error) {
    console.error('Error resetting game data:', error);
  }
}

// Run the reset
resetGameData();
