import type { Site } from '../lib/schema';
import { assetUrl } from '../lib/asset-url';

export function ProfileHeader({ profile, assetBase }: { profile: Site['profile']; assetBase?: string }) {
  return <header className="profile">
    {profile.avatar && <div className="avatar-wrap"><img className="avatar" src={assetUrl(profile.avatar, assetBase)} width="104" height="104" alt={profile.avatarAlt || `${profile.name} 프로필`}/><span className="avatar-spark" aria-hidden="true">✦</span></div>}
    {profile.eyebrow && <p className="eyebrow">{profile.eyebrow}</p>}
    <h1>{profile.name}</h1>
    {profile.bio && <p className="bio">{profile.bio}</p>}
    {profile.tags.length > 0 && <ul className="tags" aria-label={profile.tagsLabel}>{profile.tags.map(tag => <li key={tag}>#{tag}</li>)}</ul>}
  </header>;
}
