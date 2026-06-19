// Centralized Simulated LocalStorage Database for OnlyMans

const KEYS = {
  USERS: 'onlymans_users',
  POSTS: 'onlymans_posts',
  COMMENTS: 'onlymans_comments',
  REPORTS: 'onlymans_reports',
  SUBSCRIPTIONS: 'onlymans_subscriptions',
  CURRENT_USER: 'onlymans_current_user',
};

// --- INITIAL SEED DATA ---
const initialUsers = [
  { 
    id: 1, 
    username: 'marcus_fit', 
    email: 'marcus@example.com', 
    password: 'password123',
    role: 'CREATOR', 
    status: 'ACTIVE', 
    isVerified: true, 
    joinDate: '2025-10-12', 
    avatar: 'https://i.pravatar.cc/150?img=33',
    coverUrl: 'https://picsum.photos/seed/fitness/800/300',
    bio: 'Professional fitness trainer and nutritionist. Helping you reach your peak performance. 💪🏋️‍♂️',
    subscriptionPrice: '9.99'
  },
  { 
    id: 2, 
    username: 'julian_x', 
    email: 'julian@example.com', 
    password: 'password123',
    role: 'CREATOR', 
    status: 'ACTIVE', 
    isVerified: false, 
    joinDate: '2025-11-05', 
    avatar: 'https://i.pravatar.cc/150?img=53',
    coverUrl: 'https://picsum.photos/seed/luxury/800/300',
    bio: 'Lifestyle curator, fashion enthusiast, and luxury traveler. Join my exclusive journey. 🍸✨',
    subscriptionPrice: '14.99'
  },
  { 
    id: 3, 
    username: 'fanboy99', 
    email: 'fanboy99@example.com', 
    password: 'password123',
    role: 'USER', 
    status: 'ACTIVE', 
    isVerified: false, 
    joinDate: '2026-01-20', 
    avatar: 'https://i.pravatar.cc/150?img=11',
    coverUrl: '',
    bio: 'Avid fitness fan and vlogs follower!',
    subscriptionPrice: '0'
  },
  { 
    id: 4, 
    username: 'troll_user', 
    email: 'troll@example.com', 
    password: 'password123',
    role: 'USER', 
    status: 'BLOCKED', 
    isVerified: false, 
    joinDate: '2026-02-15', 
    avatar: 'https://i.pravatar.cc/150?img=12',
    coverUrl: '',
    bio: 'Just here to trigger people.',
    subscriptionPrice: '0'
  },
  { 
    id: 5, 
    username: 'sarah_vlogs', 
    email: 'sarah@example.com', 
    password: 'password123',
    role: 'CREATOR', 
    status: 'ACTIVE', 
    isVerified: true, 
    joinDate: '2026-03-01', 
    avatar: 'https://i.pravatar.cc/150?img=5',
    coverUrl: 'https://picsum.photos/seed/vlogs/800/300',
    bio: 'Daily vlogger, coffee lover, and tech enthusiast sharing behind the scenes content. 🌞☕',
    subscriptionPrice: '4.99'
  },
];

const initialPosts = [
  { 
    id: 101, 
    creatorUsername: 'marcus_fit', 
    type: 'IMAGE', 
    visibility: 'PREMIUM', 
    content: 'New intense full-body session just dropped. Push your limits with me today. 💪🔥', 
    mediaUrl: 'https://picsum.photos/seed/fitness/600/400', 
    date: '2 hours ago', 
    likes: 1400,
    likedBy: [] 
  },
  { 
    id: 102, 
    creatorUsername: 'julian_x', 
    type: 'IMAGE', 
    visibility: 'PREMIUM', 
    content: "Sneak peek from last night's red carpet. The full set is waiting for you in the vault. 🍸✨", 
    mediaUrl: 'https://picsum.photos/seed/car/600/400', 
    date: '5 hours ago', 
    likes: 3200,
    likedBy: [] 
  },
  { 
    id: 103, 
    creatorUsername: 'sarah_vlogs', 
    type: 'VIDEO', 
    visibility: 'PUBLIC', 
    content: 'Morning routine Q&A! Let me know what else you want to see! 🌞', 
    mediaUrl: 'https://picsum.photos/seed/vlog/600/400', 
    date: '1 day ago', 
    likes: 890,
    likedBy: [] 
  },
];

const initialComments = [
  { id: 1001, postId: 101, author: 'fanboy99', authorAvatar: 'https://i.pravatar.cc/150?img=11', content: 'Incredible workout man! Totally destroyed my abs today.', date: '1 hr ago' },
  { id: 1002, postId: 101, author: 'troll_user', authorAvatar: 'https://i.pravatar.cc/150?img=12', content: 'This is fake weights, nobody lifts that much easily lmao.', date: '45 mins ago' },
  { id: 1003, postId: 103, author: 'fanboy99', authorAvatar: 'https://i.pravatar.cc/150?img=11', content: 'Love the vlog! What camera do you use?', date: '12 hrs ago' },
];

const initialReports = [
  { id: 501, reportedUserId: 2, reportedUser: 'julian_x', type: 'CREATOR', reason: 'Posting inappropriate content that violates community guidelines.', reportedBy: 'fanboy99', date: '1 hr ago', status: 'PENDING' },
  { id: 502, reportedUserId: 4, reportedUser: 'troll_user', type: 'USER', reason: 'Harassing comments on multiple videos.', reportedBy: 'marcus_fit', date: '3 hrs ago', status: 'PENDING' }
];

const initialSubscriptions = [
  { id: 701, userUsername: 'fanboy99', creatorUsername: 'marcus_fit', status: 'Active', amount: '$9.99/mo', renewDate: 'Jul 15, 2026' },
  { id: 702, userUsername: 'fanboy99', creatorUsername: 'julian_x', status: 'Active', amount: '$14.99/mo', renewDate: 'Jul 22, 2026' },
];

// Helper to get from localstorage or seed
const getOrSeed = (key, defaultData) => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultData));
    return defaultData;
  }
  return JSON.parse(data);
};

// Initialize DB
export const initDB = () => {
  getOrSeed(KEYS.USERS, initialUsers);
  getOrSeed(KEYS.POSTS, initialPosts);
  getOrSeed(KEYS.COMMENTS, initialComments);
  getOrSeed(KEYS.REPORTS, initialReports);
  getOrSeed(KEYS.SUBSCRIPTIONS, initialSubscriptions);
};

// Self-execute on import
initDB();

// --- DATABASE SERVICE API ---
export const db = {
  // --- AUTH APIs ---
  login(email, password) {
    const users = getOrSeed(KEYS.USERS, initialUsers);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (user) {
      if (user.status === 'BLOCKED') {
        throw new Error('This account has been blocked by administrators.');
      }
      this.setCurrentUser(user);
      return user;
    }
    return null;
  },

  signup(username, email, password) {
    const users = getOrSeed(KEYS.USERS, initialUsers);
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      throw new Error('Username is already taken.');
    }
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email is already registered.');
    }

    const newUser = {
      id: Date.now(),
      username,
      email,
      password,
      role: 'USER',
      status: 'ACTIVE',
      isVerified: false,
      joinDate: new Date().toISOString().split('T')[0],
      avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`,
      coverUrl: '',
      bio: `Hello! I am @${username}. Welcome to my profile!`,
      subscriptionPrice: '0'
    };

    users.push(newUser);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    this.setCurrentUser(newUser);
    return newUser;
  },

  getCurrentUser() {
    const user = localStorage.getItem(KEYS.CURRENT_USER);
    return user ? JSON.parse(user) : null;
  },

  setCurrentUser(user) {
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
  },

  logout() {
    localStorage.removeItem(KEYS.CURRENT_USER);
  },

  // --- USERS / CREATORS APIs ---
  getUsers() {
    return getOrSeed(KEYS.USERS, initialUsers);
  },

  getUserByUsername(username) {
    const users = this.getUsers();
    return users.find(u => u.username.toLowerCase() === username.toLowerCase());
  },

  toggleCreatorVerification(userId) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index].isVerified = !users[index].isVerified;
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
      // update session if current user
      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        this.setCurrentUser(users[index]);
      }
      return users[index];
    }
    return null;
  },

  toggleUserBlock(userId) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index].status = users[index].status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
      return users[index];
    }
    return null;
  },

  becomeCreator(username, displayName, bio, coverUrl, avatarUrl, subscriptionPrice) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.username === username);
    if (index !== -1) {
      users[index].role = 'CREATOR';
      if (displayName) users[index].displayName = displayName;
      if (bio) users[index].bio = bio;
      if (coverUrl) users[index].coverUrl = coverUrl;
      if (avatarUrl) users[index].avatar = avatarUrl;
      if (subscriptionPrice) users[index].subscriptionPrice = subscriptionPrice;

      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
      this.setCurrentUser(users[index]);
      return users[index];
    }
    return null;
  },

  updateUserProfile(userId, data) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index] = { ...users[index], ...data };
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
      
      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        this.setCurrentUser(users[index]);
      }
      return users[index];
    }
    return null;
  },

  // --- POSTS APIs ---
  getPosts() {
    return getOrSeed(KEYS.POSTS, initialPosts);
  },

  createPost(creatorUsername, type, visibility, content, mediaUrl) {
    const posts = this.getPosts();
    const newPost = {
      id: Date.now(),
      creatorUsername,
      type: type || 'IMAGE',
      visibility: visibility || 'PUBLIC',
      content,
      mediaUrl: mediaUrl || 'https://picsum.photos/seed/post/600/400',
      date: 'Just now',
      likes: 0,
      likedBy: []
    };
    posts.unshift(newPost);
    localStorage.setItem(KEYS.POSTS, JSON.stringify(posts));
    return newPost;
  },

  updatePost(postId, data) {
    const posts = this.getPosts();
    const index = posts.findIndex(p => p.id === postId);
    if (index !== -1) {
      posts[index] = { ...posts[index], ...data };
      localStorage.setItem(KEYS.POSTS, JSON.stringify(posts));
      return posts[index];
    }
    return null;
  },

  deletePost(postId) {
    const posts = this.getPosts();
    const filtered = posts.filter(p => p.id !== postId);
    localStorage.setItem(KEYS.POSTS, JSON.stringify(filtered));
    
    // Also delete associated comments
    const comments = this.getComments();
    const filteredComments = comments.filter(c => c.postId !== postId);
    localStorage.setItem(KEYS.COMMENTS, JSON.stringify(filteredComments));
  },

  toggleLikePost(postId, username) {
    const posts = this.getPosts();
    const index = posts.findIndex(p => p.id === postId);
    if (index !== -1) {
      const likedBy = posts[index].likedBy || [];
      const userIndex = likedBy.indexOf(username);
      if (userIndex === -1) {
        likedBy.push(username);
        posts[index].likes = (posts[index].likes || 0) + 1;
      } else {
        likedBy.splice(userIndex, 1);
        posts[index].likes = Math.max(0, (posts[index].likes || 0) - 1);
      }
      posts[index].likedBy = likedBy;
      localStorage.setItem(KEYS.POSTS, JSON.stringify(posts));
      return posts[index];
    }
    return null;
  },

  togglePostVisibility(postId) {
    const posts = this.getPosts();
    const index = posts.findIndex(p => p.id === postId);
    if (index !== -1) {
      posts[index].visibility = posts[index].visibility === 'PUBLIC' ? 'HIDDEN' : 'PUBLIC';
      localStorage.setItem(KEYS.POSTS, JSON.stringify(posts));
      return posts[index];
    }
    return null;
  },

  // --- COMMENTS APIs ---
  getComments() {
    return getOrSeed(KEYS.COMMENTS, initialComments);
  },

  createComment(postId, author, authorAvatar, content) {
    const comments = this.getComments();
    const newComment = {
      id: Date.now(),
      postId,
      author,
      authorAvatar: authorAvatar || 'https://i.pravatar.cc/150?img=11',
      content,
      date: 'Just now'
    };
    comments.push(newComment);
    localStorage.setItem(KEYS.COMMENTS, JSON.stringify(comments));
    return newComment;
  },

  deleteComment(commentId) {
    const comments = this.getComments();
    const filtered = comments.filter(c => c.id !== commentId);
    localStorage.setItem(KEYS.COMMENTS, JSON.stringify(filtered));
  },

  // --- REPORTS APIs ---
  getReports() {
    return getOrSeed(KEYS.REPORTS, initialReports);
  },

  createReport(reportedUserId, reportedUser, type, reason, reportedBy) {
    const reports = this.getReports();
    const newReport = {
      id: Date.now(),
      reportedUserId,
      reportedUser,
      type,
      reason,
      reportedBy,
      date: 'Just now',
      status: 'PENDING'
    };
    reports.unshift(newReport);
    localStorage.setItem(KEYS.REPORTS, JSON.stringify(reports));
    return newReport;
  },

  resolveReport(reportId) {
    const reports = this.getReports();
    const index = reports.findIndex(r => r.id === reportId);
    if (index !== -1) {
      reports[index].status = 'RESOLVED';
      localStorage.setItem(KEYS.REPORTS, JSON.stringify(reports));
      return reports[index];
    }
    return null;
  },

  // --- SUBSCRIPTIONS APIs ---
  getSubscriptions() {
    return getOrSeed(KEYS.SUBSCRIPTIONS, initialSubscriptions);
  },

  isSubscribed(username, creatorUsername) {
    if (!username || !creatorUsername) return false;
    if (username.toLowerCase() === creatorUsername.toLowerCase()) return true; // Creator has access to own posts
    const subs = this.getSubscriptions();
    return subs.some(s => s.userUsername === username && s.creatorUsername === creatorUsername && s.status === 'Active');
  },

  subscribeToCreator(username, creatorUsername, price) {
    const subs = this.getSubscriptions();
    // Check if existing expired sub, reactivate it, otherwise add new
    const index = subs.findIndex(s => s.userUsername === username && s.creatorUsername === creatorUsername);
    
    const renewDate = new Date();
    renewDate.setMonth(renewDate.getMonth() + 1);
    const formattedDate = renewDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

    if (index !== -1) {
      subs[index].status = 'Active';
      subs[index].amount = `$${price}/mo`;
      subs[index].renewDate = formattedDate;
    } else {
      subs.push({
        id: Date.now(),
        userUsername: username,
        creatorUsername,
        status: 'Active',
        amount: `$${price}/mo`,
        renewDate: formattedDate
      });
    }
    localStorage.setItem(KEYS.SUBSCRIPTIONS, JSON.stringify(subs));
  },

  cancelSubscription(subId) {
    const subs = this.getSubscriptions();
    const index = subs.findIndex(s => s.id === subId);
    if (index !== -1) {
      subs[index].status = 'Expired';
      subs[index].renewDate = '-';
      localStorage.setItem(KEYS.SUBSCRIPTIONS, JSON.stringify(subs));
    }
  }
};
