// Sample payload shaped EXACTLY like live output, so the frontend can be
// built and tested with MOCK=1 before any keys exist.

function daysFromNow(n, hour = 20) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export function mockShows(city = "Vancouver") {
  return {
    city,
    source: "mock",
    generatedAt: new Date().toISOString(),
    shows: [
      {
        source: "ticketmaster",
        sourceId: "mock-1",
        name: "Daniel Caesar",
        dateTime: daysFromNow(2),
        date: daysFromNow(2).slice(0, 10),
        time: "20:00",
        venue: { name: "Rogers Arena", city, lat: 49.2778, lon: -123.1088 },
        artists: [
          {
            name: "Daniel Caesar",
            spotifyId: "20wkVLutqVOYrc0LB1qMVM",
            spotifyUrl: "https://open.spotify.com/artist/20wkVLutqVOYrc0LB1qMVM",
            match: "ticketmaster",
          },
        ],
        ticketUrl: "https://www.ticketmaster.com/",
        priceMin: 65,
        priceMax: 180,
        currency: "CAD",
        status: "onsale",
        image: null,
      },
      {
        source: "ticketmaster",
        sourceId: "mock-2",
        name: "Peach Pit",
        dateTime: daysFromNow(5),
        date: daysFromNow(5).slice(0, 10),
        time: "19:30",
        venue: { name: "Commodore Ballroom", city, lat: 49.2808, lon: -123.1207 },
        artists: [
          {
            name: "Peach Pit",
            spotifyId: "3ZOmqGVVn4mYfe6yUasUqn",
            spotifyUrl: "https://open.spotify.com/artist/3ZOmqGVVn4mYfe6yUasUqn",
            match: "ticketmaster",
          },
        ],
        ticketUrl: "https://www.ticketmaster.com/",
        priceMin: 45,
        priceMax: 75,
        currency: "CAD",
        status: "onsale",
        image: null,
      },
      {
        source: "ticketmaster",
        sourceId: "mock-3",
        name: "Jazz at the Fox: Late Night Quartet",
        dateTime: daysFromNow(9),
        date: daysFromNow(9).slice(0, 10),
        time: "21:00",
        venue: { name: "Fox Cabaret", city, lat: 49.2648, lon: -123.1018 },
        artists: [
          {
            name: "Late Night Quartet",
            spotifyId: null,
            spotifyUrl: null,
            match: "unresolved-no-spotify-creds",
          },
        ],
        ticketUrl: "https://www.ticketmaster.com/",
        priceMin: 20,
        priceMax: 35,
        currency: "CAD",
        status: "onsale",
        image: null,
      },
    ],
  };
}
