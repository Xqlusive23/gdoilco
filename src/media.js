// All photos and videos used by the site.
//
// Each entry lists where to look, in order. The first address is a file you can drop into public/media/
// (for example public/media/sunset.jpg). If that file does not exist the site falls back to the free Pexels
// copy, and if that cannot load either, to a drawn rig scene. So the site always shows something.
//
// For a live launch, replace these with your own photos and footage: same file names in public/media/.
// Photos and videos from Pexels are free to use under the Pexels license (https://www.pexels.com/license/).

const px = (id, w = 1600) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
const photo = (name, id, pos = 'center') => ({ srcs: [`/media/${name}.jpg`, px(id)], pos });

export const PHOTOS = {
  sunset:    photo('sunset', 87236, 'center 60%'),       // offshore platform at sunset, landscape
  dusk:      photo('dusk', 34389698, 'center 55%'),      // rig silhouetted at sunset
  glow:      photo('glow', 34389695, 'center 50%'),      // drilling structure, orange and pink sky
  aerialSun: photo('aerial-sunset', 30445637, 'center 45%'), // aerial view of a rig at sunset
  platform:  photo('platform', 16169309, 'center 50%'),  // aerial platform with support vessels, daytime
  platform2: photo('platform-2', 16169311, 'center 50%'),
  crew:      photo('crew', 35224901, 'center 40%'),      // rig and a worker on site at sunset
};

const vid = (name, url) => [`/media/${name}.mp4`, url];
export const VIDEOS = {
  hero: vid('hero', 'https://videos.pexels.com/video-files/30893940/13208584_2560_1440_30fps.mp4'),
  reel: vid('reel', 'https://videos.pexels.com/video-files/39677359/16919753_2560_1440_30fps.mp4'),
};
