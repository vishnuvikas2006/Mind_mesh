import { api } from "@/lib/api";

type TrustedPerson = { _id: string; full_name: string; enabled: boolean; permissions: string[] };

function currentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 }));
}

function locationFailure(error: unknown): Error {
  const code = typeof error === "object" && error !== null && "code" in error && typeof error.code === "number" ? error.code : undefined;
  if (code === 1) return new Error("Location permission was denied. Allow location for this site and try again.");
  if (code === 2) return new Error("Your device could not determine a location. Check Location Services and try again.");
  if (code === 3) return new Error("Location took too long to load. Move to a location with better signal and try again.");
  return error instanceof Error ? error : new Error("Unable to share the current location.");
}

async function saveApproximateLocation(): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.geolocation) throw new Error("This browser cannot share location.");
  try {
    const position = await currentPosition();
    if (!Number.isFinite(position.coords.latitude) || !Number.isFinite(position.coords.longitude)) throw new Error("Your device returned an invalid location. Please try again.");
    await api("/victim/me/location", {
      method: "PUT",
      body: JSON.stringify({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy_meters: position.coords.accuracy }),
    });
  } catch (error) { throw locationFailure(error); }
}

/** Shares a fresh, approximate snapshot after the victim explicitly selects a trusted person. */
export async function shareLocationWithTrustedPerson(trustedPersonId: string, durationMinutes = 30): Promise<void> {
  await saveApproximateLocation();
  await api("/trusted/location-shares", {
    method: "POST",
    body: JSON.stringify({ trusted_person_id: trustedPersonId, duration_minutes: durationMinutes }),
  });
}

/**
 * Runs only from a victim's explicit urgent-action click. The browser remains
 * responsible for location consent; this is an approximate snapshot, not
 * background tracking. Admins can see the victim's saved context and only
 * trusted people granted `live_location` receive a 30-minute share.
 */
export async function shareUrgentLocation(): Promise<string> {
  try {
    await saveApproximateLocation();
    const people = await api<TrustedPerson[]>("/trusted/people");
    const eligible = people.filter((person) => person.enabled && person.permissions.includes("live_location"));
    const results = await Promise.allSettled(eligible.map((person) => api("/trusted/location-shares", { method: "POST", body: JSON.stringify({ trusted_person_id: person._id, duration_minutes: 30 }) })));
    const sharedCount = results.filter((result) => result.status === "fulfilled").length;
    if (eligible.length && !sharedCount) return "Your approximate location was saved for authorised admin review, but no trusted-person share could be started. Your urgent request was still recorded.";
    return sharedCount ? `Your approximate location is shared with the admin and ${sharedCount} trusted person${sharedCount === 1 ? "" : "s"} for 30 minutes.` : "Your approximate location is available to the admin. No trusted person currently has live-location permission.";
  } catch (error) {
    return `Location was not shared. ${locationFailure(error).message} Your urgent request was still recorded.`;
  }
}
