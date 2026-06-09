import {
  collection,
  query,
  where,
  getDocs,
  getCountFromServer,
  getAggregateFromServer,
  average,
  count,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';

const toDate = (value) => {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  return new Date(value);
};

const formatDateKey = (date) => date.toISOString().split('T')[0];

const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const bucketByDate = (items, dateField, valueField) => {
  const buckets = {};
  items.forEach((item) => {
    const date = toDate(item[dateField]);
    if (!date) return;
    const key = formatDateKey(date);
    if (!buckets[key]) {
      buckets[key] = { date: key, values: [], count: 0 };
    }
    if (valueField && item[valueField] != null) {
      buckets[key].values.push(item[valueField]);
    }
    buckets[key].count += 1;
  });

  return Object.values(buckets)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((bucket) => ({
      date: bucket.date,
      count: bucket.count,
      average:
        bucket.values.length > 0
          ? Math.round(bucket.values.reduce((sum, v) => sum + v, 0) / bucket.values.length)
          : 0,
    }));
};

export const getAdminMetrics = async () => {
  const usersRef = collection(db, 'users');
  const resumesRef = collection(db, 'resumes');
  const jobMatchesRef = collection(db, 'job_matches');
  const sessionsRef = collection(db, 'interview_sessions');
  const analysisRef = collection(db, 'resume_analysis');

  const now = new Date();
  const dayStart = startOfDay(now);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  const monthStart = new Date(now);
  monthStart.setDate(now.getDate() - 30);

  const [
    totalUsersSnap,
    totalResumesSnap,
    totalJobMatchesSnap,
    totalSessionsSnap,
    atsAggSnap,
    jobMatchAggSnap,
    dailyUsersSnap,
    weeklyUsersSnap,
    monthlyUsersSnap,
  ] = await Promise.all([
    getCountFromServer(usersRef),
    getCountFromServer(resumesRef),
    getCountFromServer(jobMatchesRef),
    getCountFromServer(sessionsRef),
    getAggregateFromServer(analysisRef, {
      avgAtsScore: average('atsScore'),
      totalAnalyses: count(),
    }),
    getAggregateFromServer(jobMatchesRef, {
      avgJobMatchScore: average('matchScore'),
      totalMatches: count(),
    }),
    getCountFromServer(query(usersRef, where('createdAt', '>=', dayStart))),
    getCountFromServer(query(usersRef, where('createdAt', '>=', weekStart))),
    getCountFromServer(query(usersRef, where('createdAt', '>=', monthStart))),
  ]);

  const interviewAggSnap = await getAggregateFromServer(sessionsRef, {
    avgInterviewScore: average('avgScore'),
  });

  return {
    totalUsers: totalUsersSnap.data().count,
    totalResumeUploads: totalResumesSnap.data().count,
    totalJobMatches: totalJobMatchesSnap.data().count,
    totalInterviewSessions: totalSessionsSnap.data().count,
    averageAtsScore: Math.round(atsAggSnap.data().avgAtsScore || 0),
    averageJobMatchScore: Math.round(jobMatchAggSnap.data().avgJobMatchScore || 0),
    averageInterviewScore: Math.round(interviewAggSnap.data().avgInterviewScore || 0),
    analytics: {
      dailyUsers: dailyUsersSnap.data().count,
      weeklyUsers: weeklyUsersSnap.data().count,
      monthlyUsers: monthlyUsersSnap.data().count,
    },
  };
};

const fetchRecentDocuments = async (collectionName, maxDocs = 500) => {
  try {
    const q = query(
      collection(db, collectionName),
      orderBy('createdAt', 'desc'),
      limit(maxDocs)
    );
    const snapshot = await getDocs(q);
    const items = [];
    snapshot.forEach((docSnap) => items.push({ id: docSnap.id, ...docSnap.data() }));
    return items;
  } catch {
    const snapshot = await getDocs(collection(db, collectionName));
    const items = [];
    snapshot.forEach((docSnap) => items.push({ id: docSnap.id, ...docSnap.data() }));
    return items;
  }
};

export const getAdminChartData = async () => {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [analyses, users, sessions, jobMatches] = await Promise.all([
    fetchRecentDocuments('resume_analysis'),
    fetchRecentDocuments('users'),
    fetchRecentDocuments('interview_sessions'),
    fetchRecentDocuments('job_matches'),
  ]);

  const filterSince = (items) =>
    items.filter((item) => {
      const date = toDate(item.createdAt);
      return date && date >= since;
    });

  const recentAnalyses = filterSince(analyses);
  const recentUsers = filterSince(users);
  const recentSessions = filterSince(sessions);
  const recentJobMatches = filterSince(jobMatches);

  const atsTrends = bucketByDate(recentAnalyses, 'createdAt', 'atsScore').map((item) => ({
    date: item.date,
    score: item.average,
    analyses: item.count,
  }));

  const userGrowth = bucketByDate(recentUsers, 'createdAt').map((item) => ({
    date: item.date,
    users: item.count,
  }));

  const interviewScores = bucketByDate(recentSessions, 'createdAt', 'avgScore').map((item) => ({
    date: item.date,
    score: item.average,
    sessions: item.count,
  }));

  const jobMatchStats = bucketByDate(recentJobMatches, 'createdAt', 'matchScore').map((item) => ({
    date: item.date,
    score: item.average,
    matches: item.count,
  }));

  const jobMatchDistribution = [
    { range: '0-49', count: 0 },
    { range: '50-69', count: 0 },
    { range: '70-84', count: 0 },
    { range: '85-100', count: 0 },
  ];

  recentJobMatches.forEach((match) => {
    const score = match.matchScore || 0;
    if (score < 50) jobMatchDistribution[0].count += 1;
    else if (score < 70) jobMatchDistribution[1].count += 1;
    else if (score < 85) jobMatchDistribution[2].count += 1;
    else jobMatchDistribution[3].count += 1;
  });

  return {
    atsTrends,
    userGrowth,
    interviewScores,
    jobMatchStats,
    jobMatchDistribution,
  };
};
