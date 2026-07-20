import semver from 'semver';

export function isPreRelease(version: string): boolean {
  return semver.prerelease(version) !== null;
}

export function getUpdateTarget(version: string): string {
  if (isPreRelease(version)) {
    return 'updater-alpha';
  }
  return 'updater';
}
