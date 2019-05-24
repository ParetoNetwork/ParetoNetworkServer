
const tutorials = (function () {

  return {
    tutorial: {
      "intelmarket" : {
        header: "Intel Market",
        body : "Contains the feed of intel disclosed by other members. Your score determines when intel appears on your feed. Members with higher scores receive intel sooner than members with lower scores. The color coding of intel reveals the specific delay based on the priority level, in days:hours:minutes. Increase your score to have an advantage by rewarding active intel and purchasing more PARETO Rewards."
      },
      "activity" : {
        header: "Member Activity",
        body: "Actions that affect your PARETO score are listed here such as creating intel or rewarding other member's intel. Touching a historical item will take you to the transaction on a block explorer. Rewarding gives a temporary increase to your score and is the most effective way of rising in the ranks. The temporary boost is proportional to the amount rewarded in relation to what the intel provider requested, up to 100%, and the time of the boost counts down from that point."
      },
      "profile" : {
        header: "Member Profile",
        body: "Details about the currently active member are here. If this is your profile, you can change your avatar by touching the circular image. You can add or change your alias and biography by clicking on the bio icon. Your current balance of PARETO Rewards are visible, with a link to the block explorer. Followed by your rank and score. Your global rank is your score in relation to other members. Higher scores receive lower ranks, and get intel sooner than other members. Updated in real time."
      },
      "graphs" : {
        header: "Explorer & Network Graphs",
        body: "The explorer graph is an interactive visualization of the current intel feed, sorted by intel provider, to convey network wide confidence in a piece of intel. The network graph shows the use of PARETO Rewards over time, giving an understanding how much PARETO is off the market and locked in the platform contracts."
      },
      "leaderboard" : {
        header: "Leaderboard",
        body: "Browse all members in the Pareto Network. All holders of PARETO Rewards are counted as members and their ranks are visible on this score board. Tap the external link icon to view their address and transaction history on a block explorer. Search by rank, score or address."
      }
    }
  }
})();

export {tutorials};