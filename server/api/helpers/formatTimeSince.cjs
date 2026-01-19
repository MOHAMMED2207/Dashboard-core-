exports.formatTimeSince = async = (minutes) => {
if (minutes === null) return null;

  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else if (minutes < 1440) { // أقل من يوم
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} hour${hours !== 1 ? 's' : ''}${mins > 0 ? ' ' + mins + ' minute' + (mins !== 1 ? 's' : '') : ''}`;
  } else { // أكثر من يوم
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    return `${days} day${days !== 1 ? 's' : ''}${hours > 0 ? ' ' + hours + ' hour' + (hours !== 1 ? 's' : '') : ''}`;
  }
};

module.exports = exports;
