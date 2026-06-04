export const SHOWCASE_ROOM = {
  scanUrl: "/showcaseScans/dNY.glb",

  artist: {
    name: "Gabriel",
    bio: "Creative technologist / designer. Recently graduated. Building spatial identity tools for creatives.",
    instagram: "https://instagram.com/Gabrielrichardson_",
    handle: "@GabrielRichardson_",
  },

  artworks: [
    {
      id: "b4",
      title: "Poster One",
      url: "/showcaseArtworks/b4.png",
      size: "A0-L",

      transform: {
        position: [-1, 1, 0.08],
        rotation: [0, 3.2, 0],
        scale: [1.6, 0.76, 1],
      },

      focus: {
        distance: 2,
        yOffset: -0.34,
        targetYOffset: -0.34,
      },

      modules: [
        {
          type: "workInfo",
          title: "STUPID BULL ISH",
          usedFor: ["Posters", "Scarf", "UI"],
          medium: ["Photoshop", "Illustrator"],
          instagram: ["GabrielRichardson_", "5carf0il5alesman"],
          description:
            "I have always found bull fighting interesting. How did we find out that red made the bull go so mad. So mad that he can’t see what’s really going on around him. What a stupid bull.\n\nI wanted to point out the hypocrisy in the west, our love of bull markets, the manipulation of GDP and profit figures to inflate value, propping up dangerous market runs, and our high class morals of wanting to ban bull fighting because of it’s so called immorality, both of which leaving some stupid little creature with it’s legs in the air.\n\nWhat really is the difference, between the well trained, precise movements of a bull fighter, blinding this bull into moving exactly how you want, and that of a market run.\n\nWhat stupid fucking bull ish.",
        },

        {
          type: "processStrip",
          title: "Process",
          items: [
            {
              image: "/assets/ProcessStrip/im1.jpg",
              title: "Initial Image",
              orientation: "portrait",
              text:
                "I found this image of the bull. I needed its legs in the air and as much rotation as possible.",
            },
            {
              image: "/assets/ProcessStrip/im2.jpg",
              title: "Orientation Sketch",
              orientation: "portrait",
              text:
                "I started by drawing from the image, trying to work out the orientation I was looking for.",
            },
            {
              image: "/assets/ProcessStrip/im3.jpg",
              title: "Photoshop Pass",
              orientation: "portrait",
              text:
                "I cut out the parts I needed, resized them, and started introducing texture, blur and grain.",
            },
            {
              image: "/assets/ProcessStrip/im4.jpg",
              title: "Edits",
              orientation: "portrait",
              text:
                "More of the same. Playing with highlights and working out what I wanted to show off.",
            },
            {
              image: "/assets/ProcessStrip/im5.2.jpg",
              title: "Find New Elements",
              orientation: "portrait",
              text:
                "I added a vector mark made in Illustrator, meant to feel like a bad PowerPoint slide about profit increasing.",
            },
            {
              image: "/assets/ProcessStrip/im6.jpg",
              title: "New Orientation and Edits",
              orientation: "landscape",
              text:
                "I tried it as my screensaver and it ended up working better sideways.",
            },
            {
              image: "/assets/ProcessStrip/im7.jpg",
              title: "Edits For New Use",
              orientation: "portrait",
              text:
                "I wanted to screenprint it onto a scarf, so I re-edited it to work better with the mesh.",
            },
          ],
        },
      ],
    },

    {
      id: "itm-tall",
      title: "Poster Three",
      url: "/showcaseArtworks/itm-tall.jpg",
      size: "A0",

      transform: {
        position: [0.8, 0.26, 0.05],
        rotation: [0, 3.2, 0],
        scale: [0.6, 0.6, 0.6],
      },

      focus: {
        distance: 1.4,
        yOffset: -0.6,
        targetYOffset: -0.6,
      },

      modules: [
        {
          type: "workInfo",
          title: "In The Middle",
          usedFor: ["Branding imagery"],
          medium: ["Photoshop"],
          projects: ["www.ambroise.co.uk"],
          description:
            "I didn’t have all that much to do last summer so I figured I would find something new to be interested in. I found a couple of ballet videos on YouTube and started going a little into it. Being of my time, and only somewhat insufferable, I found The Nutcracker boring, but eventually ran into William Forsythe.\n\nThis graphic is from ‘In the Middle, Somewhat Elevated’. The music was fantastic, produced by Thom Willems, completely un-ballet-like, and the dancing is similarly experimental. I thought it was great, really digital.\n\nForsythe talks about wanting the human form to stretch out of the frame, or beyond the frame, and I wonder if digital is what he means, as we all become somewhat cyborg, albeit to various levels.\n\nWould I get the Neuralink chip? No.\nWould I go to Mars? Also no.\nDid I invest in Bitcoin? I sold it at a loss years ago.\n\nBUT I do like the film ‘Strange Days’, and I played the shit out of Cyberpunk even though it’s boring. That’s kind of how far I’d go.",
        },

        {
          type: "videoReference",
          title:
            "In the Middle, Somewhat Elevated - Marta Romagna, Roberto Bolle, Zenaida Yanowsky",
          image: "/assets/VideoRefs/in-the-middle.jpg",
          url: "https://youtu.be/NghGmjtxeak?si=tYSNdzJd69atT6p3",
          duration: "3:32",
        },

        {
          type: "playlist",
          playlists: [
            {
              title: "Green, pink, red, orange, navy",
              subtitle: "147 songs, 10 hr 31 min",
              quote: "Think of those 1997 Prada Ads.",
              cover: "/assets/Playlists/cover1.png",
              spotify:
                "https://open.spotify.com/playlist/7AJChEzXgX17zrlS1gbwPm?si=061b98a273d1402b",
              tracks: [
                { title: "The Force", artist: "Aim, QNC", album: "Cold Water Music" },
                { title: "6 Underground", artist: "Sneaker Pimps", album: "Becoming X" },
                { title: "Won't Get Fooled Again - Original Version", artist: "The Who", album: "Who's Next" },
                { title: "The Wind", artist: "PJ Harvey", album: "Is This Desire?" },
                { title: "Sunset (Bird of Prey)", artist: "Fatboy Slim", album: "Halfway Between the Gutter and the Stars" },
              ],
            },

            {
              title: "5ense of Purpose",
              subtitle: "60 songs, 4 hr 58 min",
              quote: "Used Volvo peddler with ambitions of vintage Porsches.",
              cover: "/assets/Playlists/cover2.png",
              spotify:
                "https://open.spotify.com/playlist/0JkLhx6ZW6HOd8lusLTT4f?si=104d21f565354bf2",
              tracks: [
                { title: "Contact the Fact", artist: "The Sound", album: "From the Lions Mouth" },
                { title: "Julie Profumo", artist: "The Cleaners From Venus", album: "Going to England" },
                { title: "Soft to Touch", artist: "Narrow Head", album: "Moments of Clarity" },
                { title: "Sober", artist: "TOOL", album: "Undertow" },
                { title: "Good", artist: "Morphine", album: "Good" },
              ],
            },

            {
              title: "Today I Have Achieved About About Absolutely Naught",
              subtitle: "255 songs, 18 hr 28 min",
              quote: "Yet I did less fuck all than yesterday at least.",
              cover: "/assets/Playlists/cover4.png",
              spotify:
                "https://open.spotify.com/playlist/15dJvML5uAzEn2xAkR52Od?si=93b13b6a09124fbb",
              tracks: [
                { title: "Octivebyoctive", artist: "Sibot", album: "In With The Old" },
                { title: "It Was Supposed To Be so Easy", artist: "The Streets", album: "A Grand Don't Come For Free" },
                { title: "Flinch", artist: "alexsucks", album: "Autopilot" },
                { title: "Weapon of Choice", artist: "Fatboy Slim", album: "Weapon of Choice EP" },
                { title: "Take California", artist: "Propellerheads", album: "Decksandrumsandrockandroll" },
              ],
            },
          ],
        },
      ],
    },
  ],
};