I need to generate seed data for my Convex database that will be used in a church communication app called churchthreads.

The app allows Christian churches and groups within churches to communicate in a social-like feed. Each church is an "organization" in the database. Each organization has:

- users (all posts and messages are written by users; they can have avatar images)
- feeds (think of these as "channels" containing posts)
- posts (the actual content in the feeds; can contain text and images. Posts are like a post on social media - they should be self-contained. Posts can have messages where the post's content can be further discussed)
- userFeeds (which users are members of which feeds)
- messages (these are like chat messages or comments within a post. These are like comments on social media)

The data is always scoped to a single organization and never shared between organizations.

---

## Example of what we are creating

Here is a full JSON example of what we want in the end:

```json
{
  "organizations": [
    {
      "orgName": "Communion",
      "orgLocation": "Mount Vernon, WA",
      "orgHost": "communion.churchthreads.dev",

      "users": [
        {
          "email": "john@communion.church",
          "name": "John Davidson",
          "image": "man1.jpg"
        },
        {
          "email": "sarah@communion.church",
          "name": "Sarah Chen",
          "image": "woman2.jpg"
        },
        {
          "email": "mike@communion.church",
          "name": "Mike Johnson",
          "image": "man3.jpg"
        }
      ],

      "feeds": [
        {
          "name": "Announcements",
          "privacy": "public"
        },
        {
          "name": "Davidson homegroup",
          "privacy": "private"
        },
        {
          "name": "Philippians study",
          "privacy": "open"
        },
        {
          "name": "Coffee setup",
          "privacy": "public"
        }
      ],

      "userFeeds": [
        {
          "userIndex": 0,
          "feedIndex": 0,
          "owner": true
        },
        {
          "userIndex": 0,
          "feedIndex": 1,
          "owner": true
        },
        {
          "userIndex": 1,
          "feedIndex": 0,
          "owner": false
        },
        {
          "userIndex": 1,
          "feedIndex": 1,
          "owner": false
        },
        {
          "userIndex": 2,
          "feedIndex": 2,
          "owner": true
        }
      ],

      "posts": [
        {
          "content": {
            "type": "doc",
            "content": [
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Service is at 10 AM this Sunday. We're continuing our series on the Book of James."
                  }
                ]
              }
            ]
          },
          "feedIndex": 0,
          "userIndex": 0
        },
        {
          "content": {
            "type": "doc",
            "content": [
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Can we meet at 7 PM instead of 6:30 this week? I have a late meeting."
                  }
                ]
              }
            ]
          },
          "feedIndex": 1,
          "userIndex": 1
        }
      ],

      "messages": [
        {
          "postIndex": 1,
          "userIndex": 0,
          "content": {
            "type": "doc",
            "content": [
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "That works for me!"
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  ]
}
```

**Important notes about the JSON structure:**

- `{object}Index` properties reference the index position in their respective arrays
- For example, `userIndex: 0` references the first user in the `users` array
- Make sure post content relates to the feed it's posted in
- Make sure message content relates to the post it's commenting on
- Make sure userFeed relationships make sense (users should be members of feeds where they post)

---

## Organization Requirements

Create exactly **1 organization** with the following:

- **orgName**: King's Cross
- **orgLocation**: Bellingham, WA
- **orgHost**: kingscross.churchthreads.dev
- **Users**: Between 8-12 users
- **Extra testing user**: Add an extra test user with the name Nolan Picini and the email nolanpic+kingscross@gmail.com. This user should be added as a member of all feeds

---

## Feeds

Create the following feeds:

### Announcements & Events

- **Purpose**: A place for everyone, both church members and visitors, to see offical church communications from leadership around general announcements and events.
- **Privacy**: `public`

### Cromwell homegroup

- **Purpose**: A homegroup that meets at the Cromwell home for meals, prayer, study, and community.
- **Privacy**: `private`

### Mere Christianity study

- **Purpose**: A book club that is currently reading Mere Christianity by C.S. Lewis. They use this feed to plan meetups, to post questions about the book that they forgot to ask in-person, or post resources like further reading.
- **Privacy**: `open`

### Grounds maintenance

- **Purpose**: Updates around the church's grounds. Things like dates of work parties, progress on long-standing projects, etc.
- **Privacy**: `open`

### Coffee bar

- **Purpose**: Volunteer coordination for the coffee bar, which serves espresso drinks, drip coffee, and tea.
- **Privacy**: `open`

### Men's hiking

- **Purpose**: Updates and dates for men's hiking trips.
- **Privacy**: `open`

### Sound & Slides

- **Purpose**: Volunteer coodination for running sound and slides for Sunday services.
- **Privacy**: `private`

---

## User Avatar Instructions

Every user should have an avatar image assigned. You should look in `@/scripts/seed/assets/avatars` to find available images. They will look something like this:

- `man1.jpg`, `man2.jpg`, `man3.jpg`, `man4.jpg`
- `woman1.jpg`, `woman2.jpg`, `woman3.jpg`, `woman4.jpg`

Assign an appropriate avatar to each user based on their name (e.g., if the name is "John", use a "man" avatar; if the name is "Sarah", use a "woman" avatar). Make sure that each image is only used once!

Please make sure that `man2.jpg` is used for the pastor's user account. He should have a last name of "Cromwell".

**User object format:**

```json
{
  "email": "john@church.com",
  "name": "John Johnson",
  "image": "man4.jpg"
}
```

---

## Post Image Instructions

Some posts should include embedded images. You should look in `@/scripts/seed/assets/posts/` to find available images. They will have descriptions in their name, like this:

- `church-basement-floor-progress.jpg`
- `youth-group-pizza-party.jpg`
- `thanksgiving-potluck-spread.jpg`
- `ceiling-leak-in-youth-room.jpg`
- `mere-christianity-cs-lewis.jpg`
- `oyster-dome-hike.jpg`

**When to use images:**
You can get an idea of what the image is by its name, and then create content around that image. Some examples:

- Church events (potlucks, gatherings, youth events)
- Ministry work (grounds maintenance, food drives, coffee setup)
- Facility updates (construction, renovations, improvements)
- Group gatherings (homegroups, Bible studies, hikes)

**Important:**

- When a post includes an image, add an `images` array field with the list of image filenames
- In the TipTap JSON content, use `PLACEHOLDER/{filename}` as the image `src`
- You should use all the images, though not every post will have an image. Try to space out posts with images so that they aren't all in a row
- Do not use the same image more than once

**Example post with image:**

```json
{
  "content": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [
          {
            "type": "text",
            "text": "Great progress on the basement today!"
          }
        ]
      },
      {
        "type": "image",
        "attrs": {
          "src": "PLACEHOLDER/church-basement-floor-progress.jpg",
          "alt": null,
          "title": null,
          "width": null,
          "height": null
        }
      },
      {
        "type": "paragraph",
        "content": [
          {
            "type": "text",
            "text": "The new flooring is looking amazing. Thanks to everyone who helped out today!"
          }
        ]
      }
    ]
  },
  "feedIndex": 0,
  "userIndex": 2
  "images": ["church-basement-floor-progress.jpg"]
}
```

---

## TipTap JSON Format

**CRITICAL**: All post and message `content` fields MUST be TipTap JSON objects, NOT HTML strings.

### Text-only Post Example:

```json
{
  "content": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [
          {
            "type": "text",
            "text": "Hey everyone! Just a reminder that this Sunday we're starting our new series on the Book of James."
          }
        ]
      }
    ]
  },
  "feedIndex": 0,
  "userIndex": 0
}
```

### Multi-paragraph Post Example:

```json
{
  "content": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [
          {
            "type": "text",
            "text": "We need volunteers for next Sunday's coffee setup. It's a simple job - just arrive at 8:15 AM to get things started."
          }
        ]
      },
      {
        "type": "paragraph",
        "content": [
          {
            "type": "text",
            "text": "Let me know if you can help out!"
          }
        ]
      }
    ]
  },
  "feedIndex": 3,
  "userIndex": 5
}
```

### Message Example (in response to a post):

```json
{
  "postIndex": 0,
  "userIndex": 1,
  "content": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [
          {
            "type": "text",
            "text": "I can help with that! Count me in."
          }
        ]
      }
    ]
  }
}
```

---

## Content Quality Guidelines

**Write like real people having genuine conversations.** This is critical for realistic seed data.

### AVOID "Christianese" Language

Do NOT use overly religious or formal phrases like:

- "Blessed beyond measure"
- "Lifted up in prayer"
- "God laid it on my heart"
- "Fellowship in His presence"
- "Poured into the ministry"

### AVOID Marketing-Speak

Do NOT use promotional tone like:

- "Join us for an amazing time!"
- "You won't want to miss this incredible opportunity!"
- "Get ready for the best Sunday yet!"

### DO Write Naturally

Write the way real church members actually talk:

- "Can someone help with setup on Sunday?"
- "We're reading through Philippians - anyone want to join?"
- "Thanks for fixing the leak in the basement, Tom!"
- "Is the potluck still happening or did we reschedule?"

### Feed Context Determines Tone

**Official announcements**: Professional but warm

- "Service starts at 10 AM this Sunday. We're continuing the series on James."
- "The parking lot will be closed Saturday morning for paving work."

**Homegroups**: Casual, personal, friendly

- "Can we do Thursday instead of Wednesday this week? I have a work thing."
- "I'll bring snacks. Anyone have dietary restrictions I should know about?"

**Bible studies**: Thoughtful, discussion-oriented

- "I'm stuck on verse 12. What does Paul mean by 'work out your salvation'?"
- "Really good discussion last week. Looking forward to finishing chapter 3."

**Volunteer feeds**: Practical, collaborative

- "I can mow the lawn Saturday morning if someone can edge."
- "We collected 47 boxes for the food drive. Great work everyone!"

### Focus on Real Church Activities

Posts should be about genuine church activities:

- Facility maintenance and repairs
- Event coordination (potlucks, gatherings, service times)
- Bible study discussions and questions
- Community support and care
- Volunteer scheduling and coordination
- Practical logistics and planning

---

## Post and Message Volume Requirements

- **Posts per feed**: 8-15 posts
- **Messages per post**: 0-7 messages (many posts will have 0 messages)
- **Content length**: Posts should generally have more than one paragraph (2-4), whereas messages should be shorter (1-3 sentences).

---

## Output File Instructions

Once you've generated the data, save it as:
**`seed-data-{org-name}-{date}.json`**

Where:

- `{org-name}` is a simplified version of the organization name (lowercase, no spaces)
- `{date}` is in YYYY-MM-DD format

**Example**: `seed-data-communion-2025-10-24.json`

---

## Order of tasks

I want you to break up this project into tasks:

1. Create users, feeds, and user-to-feed relationships
2. Create posts
3. Create messages

I want you to pause between each of these tasks so that I can review.

## Final Checklist

Before generating, ensure you include:

- [x] Exactly 1 organization with 8-12 users
- [x] 5-7 feeds with good category diversity
- [x] At least 1 public feed (announcements/events)
- [x] Every user has an avatar assigned
- [x] 20-30% of posts include images
- [x] 8-15 posts per feed
- [x] 0-7 messages per post
- [x] All content is TipTap JSON objects (NOT HTML)
- [x] Content is natural and conversational (no "Christianese")
- [x] userFeed relationships make sense for the data
