const fs = require('fs');
const path = require('path');

const MANIFEST_PATH = 'D:\\AUTOMATIC_WORKFLOWS\\TRANSCRIPTION\\manifest.json';
const TRANSCRIPT_DIR = 'D:\\PRODUCTS DIGITAL TEXT';
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'data', 'course_index.json');

// Build index from manifest (source folders = courses)
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
const courses = {};

for (const [filePath, meta] of Object.entries(manifest.files)) {
  const parts = filePath.split('\\');
  const fileName = parts[parts.length - 1];
  const parentFolder = parts[parts.length - 2] || 'Unknown';
  const grandParent = parts[parts.length - 3] || '';

  // Use parent folder as course name, grandparent as category
  if (!courses[parentFolder]) {
    courses[parentFolder] = {
      name: parentFolder,
      category: grandParent,
      sourcePath: parts.slice(0, -1).join('\\'),
      lessons: [],
      totalDuration: 0,
      totalWords: 0,
    };
  }

  // Find corresponding transcript
  const baseName = fileName.replace(/\.[^.]+$/, '');
  const transcriptPath = path.join(TRANSCRIPT_DIR, baseName + '.txt');
  const hasTranscript = fs.existsSync(transcriptPath);
  let wordCount = meta.word_count || 0;
  let preview = '';

  if (hasTranscript && wordCount === 0) {
    const content = fs.readFileSync(transcriptPath, 'utf8');
    wordCount = content.split(/\s+/).length;
    preview = content.slice(0, 200).trim();
  } else if (hasTranscript) {
    const content = fs.readFileSync(transcriptPath, 'utf8');
    preview = content.slice(0, 200).trim();
  }

  courses[parentFolder].lessons.push({
    file: fileName,
    transcript: baseName + '.txt',
    hasTranscript,
    duration: meta.duration_seconds || 0,
    words: wordCount,
    status: meta.status,
    preview,
  });

  courses[parentFolder].totalDuration += (meta.duration_seconds || 0);
  courses[parentFolder].totalWords += wordCount;
}

// Sort lessons within each course
for (const course of Object.values(courses)) {
  course.lessons.sort((a, b) => a.file.localeCompare(b.file));
  course.lessonCount = course.lessons.length;
  // Estimate reading time (200 wpm)
  course.readingTimeMin = Math.round(course.totalWords / 200);
}

// Sort courses by lesson count
const sorted = Object.values(courses).sort((a, b) => b.lessonCount - a.lessonCount);

// Summary
const summary = {
  totalCourses: sorted.length,
  totalLessons: sorted.reduce((s, c) => s + c.lessonCount, 0),
  totalWords: sorted.reduce((s, c) => s + c.totalWords, 0),
  totalDurationHours: Math.round(sorted.reduce((s, c) => s + c.totalDuration, 0) / 3600 * 10) / 10,
  generatedAt: new Date().toISOString(),
};

const output = { summary, courses: sorted };

// Ensure output dir exists
fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

console.log('Course Index Built:');
console.log(`  ${summary.totalCourses} courses, ${summary.totalLessons} lessons`);
console.log(`  ${summary.totalWords.toLocaleString()} words, ${summary.totalDurationHours}h audio`);
console.log(`  Saved to ${OUTPUT_PATH}`);

// Print top 20
console.log('\nTop 20 Courses:');
for (const c of sorted.slice(0, 20)) {
  const hrs = Math.round(c.totalDuration / 60);
  console.log(`  ${c.lessonCount.toString().padStart(3)} lessons | ${c.totalWords.toLocaleString().padStart(8)} words | ${hrs}m | ${c.name}`);
}
