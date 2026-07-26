# HoopTrust API Contract Draft

## POST /api/contact-requests

Creates a recruiter-to-player contact request.

Request body:

```json
{
  "recruiterId": "recruiter-uuid",
  "playerId": "player-uuid",
  "message": "We are interested in learning more about your upcoming schedule."
}
```

Response:

```json
{
  "id": "request-uuid",
  "status": "pending",
  "recruiterId": "recruiter-uuid",
  "playerId": "player-uuid",
  "message": "..."
}
```

## POST /api/stats/verify

Updates the verification status of a submitted stat line.

Request body:

```json
{
  "statId": "stat-uuid",
  "status": "verified",
  "confidence": "High",
  "verifierNote": "Matched against coach sheet and video timestamps."
}
```

Response:

```json
{
  "statId": "stat-uuid",
  "status": "verified",
  "confidence": "High",
  "updatedAt": "2026-07-07T00:00:00.000Z"
}
```

## HoopTrust Rhythm preview endpoint

### `POST /api/spotify/rhythm-preview`

Returns the current mock recommendation for the HoopTrust Rhythm UI. This endpoint is intentionally a framework endpoint only. In a later build, replace the response logic with Spotify OAuth, catalog search, playlist creation, playlist update, and playlist open-link generation.

Request body:

```json
{
  "situationId": "pre-game",
  "moodId": "nervous",
  "goalId": "lock-in"
}
```

Response body:

```json
{
  "status": "preview_only",
  "message": "This endpoint returns the current mock recommendation. Replace this with Spotify OAuth and playlist creation in a later build.",
  "recommendation": {
    "playlistName": "HoopTrust Rhythm · Pre-Game Lock-In",
    "vibe": "confident, controlled, focused",
    "bpmRange": "85–120 BPM",
    "tracks": []
  }
}
```
