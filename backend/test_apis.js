require('dotenv').config();

const { prisma } = require('./src/config/database');
const userService = require('./src/modules/users/services/user.service');
const feedService = require('./src/modules/feed/services/feed.service');
const creatorService = require('./src/modules/creators/services/creator.service');
const postService = require('./src/modules/posts/services/post.service');
const videoService = require('./src/modules/videos/services/video.service');

async function test() {
  try {
    console.log("Starting API tests...");

    // 1. Find or create a subscriber and a creator
    let subscriber = await prisma.user.findFirst({
      where: { role: 'USER' }
    });
    
    let creator = await prisma.user.findFirst({
      where: { role: 'CREATOR' }
    });

    let createdMockData = false;

    if (!subscriber) {
      console.log("No existing subscriber found. Creating a mock subscriber...");
      subscriber = await prisma.user.create({
        data: {
          email: `sub_test_${Date.now()}@example.com`,
          username: `sub_test_${Date.now()}`,
          passwordHash: 'dummy_hash',
          role: 'USER',
          isVerified: true
        }
      });
      createdMockData = true;
    }

    if (!creator) {
      console.log("No existing creator found. Creating a mock creator...");
      creator = await prisma.user.create({
        data: {
          email: `creator_test_${Date.now()}@example.com`,
          username: `creator_test_${Date.now()}`,
          passwordHash: 'dummy_hash',
          role: 'CREATOR',
          isVerified: true,
          creatorProfile: {
            create: {
              bio: 'Mock fitness fitness curator bio',
              price: 9.99,
              avatarUrl: 'https://example.com/avatar.webp',
              coverUrl: 'https://example.com/cover.webp'
            }
          }
        },
        include: {
          creatorProfile: true
        }
      });
      createdMockData = true;
    }

    // Ensure creator has a profile
    let profile = await prisma.creatorProfile.findUnique({
      where: { userId: creator.id }
    });
    if (!profile) {
      console.log("Creating creator profile for mock creator...");
      profile = await prisma.creatorProfile.create({
        data: {
          userId: creator.id,
          bio: 'Mock fitness fitness curator bio',
          price: 9.99,
          avatarUrl: 'https://example.com/avatar.webp',
          coverUrl: 'https://example.com/cover.webp'
        }
      });
    }

    // Ensure we have a subscription
    let subscription = await prisma.subscription.findFirst({
      where: {
        subscriberId: subscriber.id,
        creatorId: creator.id
      }
    });

    if (!subscription) {
      console.log("Creating subscription from subscriber to creator...");
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      subscription = await prisma.subscription.create({
        data: {
          subscriberId: subscriber.id,
          creatorId: creator.id,
          status: 'ACTIVE',
          endDate: endDate
        }
      });
    }

    // Ensure we have at least one public and one premium post for the creator
    let publicPost = await prisma.post.findFirst({
      where: { creatorId: creator.id, visibility: 'PUBLIC' }
    });

    if (!publicPost) {
      console.log("Creating public post for creator...");
      publicPost = await prisma.post.create({
        data: {
          creatorId: creator.id,
          content: 'This is a public test post',
          visibility: 'PUBLIC'
        }
      });
    }

    let premiumPost = await prisma.post.findFirst({
      where: { creatorId: creator.id, visibility: 'PREMIUM' }
    });

    if (!premiumPost) {
      console.log("Creating premium test post...");
      premiumPost = await prisma.post.create({
        data: {
          creatorId: creator.id,
          content: 'This is a premium subscriber post',
          visibility: 'PREMIUM'
        }
      });
    }

    // --- TEST: Dashboard API ---
    console.log("Testing getUserDashboard service function...");
    const dashboardData = await userService.getUserDashboard(subscriber.id);
    console.log("Dashboard stats:", dashboardData.stats);

    // --- TEST: Feed API ---
    console.log("Testing getRandomFeed service function...");
    const feedData = await feedService.getRandomFeed(subscriber.id);
    console.log("Feed posts count:", feedData.posts.length);

    // --- TEST: Explore API ---
    console.log("Testing searchCreators service function with category Fitness...");
    const exploreData = await creatorService.searchCreators({ category: 'Fitness' });
    console.log("Search result size:", exploreData.length);

    // --- TEST: Secure Profile details API ---
    console.log("Testing getSecureProfile service function for subscribed view...");
    const secureProfileSubscribed = await creatorService.getSecureProfile(subscriber.id, creator.id);
    console.log("Profile isSubscribed status (should be true):", secureProfileSubscribed.isSubscribed);

    // --- TEST: Subscriptions list & Cancel API ---
    console.log("Testing getUserSubscriptions service function...");
    const subsList = await userService.getUserSubscriptions(subscriber.id);
    console.log("Subscriptions list length:", subsList.length);

    console.log("Testing cancelUserSubscription service function...");
    await userService.cancelUserSubscription(subscriber.id, subscription.id);
    console.log("Subscription cancelled!");

    // Re-activate subscription to leave DB clean
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'ACTIVE' }
    });

    // --- TEST: Payment Methods APIs ---
    console.log("Testing Payment Methods service wrappers...");
    const initialCards = await userService.getPaymentMethods(subscriber.id);
    console.log("Initial payment methods list length:", initialCards.length);

    console.log("Adding new payment method...");
    const newCard = await userService.addPaymentMethod(subscriber.id, { brand: 'MasterCard', last4: '5555' });
    console.log("Added card details:", newCard);

    const cardsAfterAdd = await userService.getPaymentMethods(subscriber.id);
    console.log("Payment methods list after add:", cardsAfterAdd.length);

    console.log("Removing payment method...");
    await userService.removePaymentMethod(subscriber.id, newCard.id);
    const cardsAfterRemove = await userService.getPaymentMethods(subscriber.id);
    console.log("Payment methods list after remove:", cardsAfterRemove.length);

    // --- TEST: Likes & Comments APIs ---
    console.log("Testing Likes and Comments endpoints...");

    // Create a temporary dummy user for testing likes and comments to not pollute main test data
    const testUser = await prisma.user.create({
      data: {
        email: `like_comment_tester_${Date.now()}@example.com`,
        username: `lc_tester_${Date.now()}`,
        passwordHash: 'dummy_hash',
        role: 'USER',
        isVerified: true
      }
    });

    try {
      console.log("Toggling like on public post (should like)...");
      const likeRes1 = await postService.togglePostLike(testUser.id, publicPost.id);
      console.log("Like toggle response (liked status):", likeRes1.liked);

      console.log("Toggling like on public post again (should unlike)...");
      const likeRes2 = await postService.togglePostLike(testUser.id, publicPost.id);
      console.log("Like toggle response (liked status):", likeRes2.liked);

      console.log("Adding comment to public post...");
      const comment = await postService.addComment(testUser.id, publicPost.id, 'Wow, amazing post!');
      console.log("Created comment content:", comment.content);
      console.log("Created comment user:", comment.user.username);

      console.log("Getting comments list for post...");
      const commentsList = await postService.getPostComments(publicPost.id);
      console.log("Comments list size:", commentsList.length);
      console.log("First comment in list:", commentsList[0].content);

      console.log("Deleting comment...");
      await postService.removeComment(testUser.id, comment.id);
      console.log("Comment deleted!");

      console.log("Getting comments list after delete...");
      const commentsListAfter = await postService.getPostComments(publicPost.id);
      console.log("Comments list size post-delete:", commentsListAfter.length);

    } finally {
      // Cleanup test user
      await prisma.user.delete({
        where: { id: testUser.id }
      });
    }

    // --- TEST: Saved Posts / Favorites APIs ---
    console.log("Testing Saved Posts / Favorites endpoints...");
    
    // Create a temporary user to test bookmarks
    const favSub = await prisma.user.create({
      data: {
        email: `fav_sub_${Date.now()}@example.com`,
        username: `fav_sub_${Date.now()}`,
        passwordHash: 'dummy_hash',
        role: 'USER',
        isVerified: true
      }
    });

    try {
      console.log("Toggling bookmark on public post (should bookmark)...");
      const bookmarkRes1 = await postService.togglePostBookmark(favSub.id, publicPost.id);
      console.log("Bookmark toggle response (bookmarked status):", bookmarkRes1.bookmarked);

      console.log("Fetching user favorites list...");
      const favoritesList = await postService.getUserFavorites(favSub.id);
      console.log("Favorites list size (should be 1):", favoritesList.length);
      if (favoritesList.length > 0) {
        console.log("Bookmarked post id:", favoritesList[0].id);
        console.log("Bookmarked post content:", favoritesList[0].content);
        console.log("Bookmarked post isLocked status (should be false since it is public):", favoritesList[0].isLocked);
      }

      console.log("Toggling bookmark on public post again (should remove)...");
      const bookmarkRes2 = await postService.togglePostBookmark(favSub.id, publicPost.id);
      console.log("Bookmark toggle response (bookmarked status):", bookmarkRes2.bookmarked);

      const favoritesListAfter = await postService.getUserFavorites(favSub.id);
      console.log("Favorites list size after untoggle (should be 0):", favoritesListAfter.length);

      // Now test blurring security on favorites
      console.log("Bookmarking a premium post...");
      await postService.togglePostBookmark(favSub.id, premiumPost.id);
      
      console.log("Fetching favorites (should be locked/blurred because no active subscription)...");
      const favoritesListPrem = await postService.getUserFavorites(favSub.id);
      console.log("Premium bookmarked post in favorites list isLocked status (should be true):", favoritesListPrem[0].isLocked);
      
      // Clean bookmark
      await postService.togglePostBookmark(favSub.id, premiumPost.id);

    } finally {
      await prisma.user.delete({
        where: { id: favSub.id }
      });
    }

    // --- TEST: Deactivate Account API ---
    console.log("Testing deactivateUserAccount service wrapper...");
    const deactUser = await prisma.user.create({
      data: {
        email: `deact_test_${Date.now()}@example.com`,
        username: `deact_test_${Date.now()}`,
        passwordHash: 'dummy_hash',
        role: 'USER',
        isVerified: true
      }
    });
    
    try {
      console.log("Initial isActive status:", deactUser.isActive);
      await userService.deactivateUserAccount(deactUser.id);
      const updatedDeactUser = await prisma.user.findUnique({
        where: { id: deactUser.id }
      });
      console.log("Post deactivation isActive status (should be false):", updatedDeactUser.isActive);
    } finally {
      await prisma.user.delete({
        where: { id: deactUser.id }
      });
    }

    // --- TEST: Secure Video Streaming APIs ---
    console.log("Testing Secure Video Player and Streaming endpoints...");
    
    // Create a mock post with video media
    const videoPost = await prisma.post.create({
      data: {
        creatorId: creator.id,
        content: 'Exclusive behind-the-scenes video shoot!',
        visibility: 'PREMIUM',
        media: {
          create: {
            type: 'VIDEO',
            url: 'uploads/videos/sunset-shoot-master.m3u8'
          }
        }
      },
      include: {
        media: true
      }
    });

    // Create a temporary unsubscribed user
    const unsubTester = await prisma.user.create({
      data: {
        email: `video_unsub_tester_${Date.now()}@example.com`,
        username: `v_unsub_${Date.now()}`,
        passwordHash: 'dummy_hash',
        role: 'USER',
        isVerified: true
      }
    });

    try {
      console.log("Checking video details for unsubscribed user (hasAccess should be false)...");
      const videoDetailsUnsub = await videoService.getVideoDetails(unsubTester.id, videoPost.id);
      console.log("Details for unsubscribed hasAccess (should be false):", videoDetailsUnsub.hasAccess);
      console.log("Details for unsubscribed streamUrl (should be null):", videoDetailsUnsub.streamUrl);

      console.log("Checking video details for owner (hasAccess should be true)...");
      const videoDetailsOwner = await videoService.getVideoDetails(creator.id, videoPost.id);
      console.log("Details for owner hasAccess:", videoDetailsOwner.hasAccess);
      console.log("Details for owner streamUrl:", videoDetailsOwner.streamUrl);

      console.log("Checking video stream URL generation for authorized owner...");
      const streamRes = await videoService.getVideoStreamUrl(creator.id, videoPost.id);
      console.log("Stream signed URL generated:", streamRes.streamUrl);

      // Verify that accessing stream URL for unauthorized user throws 403
      console.log("Verifying unauthorized access throws 403...");
      try {
        await videoService.getVideoStreamUrl(unsubTester.id, videoPost.id);
        console.log("Error: Managed to get stream URL without subscription!");
      } catch (err) {
        console.log("Success: Access denied caught as expected! Message:", err.message);
      }

    } finally {
      // Cleanup video post and unsub user
      await prisma.post.delete({
        where: { id: videoPost.id }
      });
      await prisma.user.delete({
        where: { id: unsubTester.id }
      });
    }

    // --- TEST: Creator Comment Moderation APIs ---
    console.log("Testing Creator Comment Moderation service methods...");
    const modCommentUser = await prisma.user.create({
      data: {
        email: `mod_comment_tester_${Date.now()}@example.com`,
        username: `mc_tester_${Date.now()}`,
        passwordHash: 'dummy_hash',
        role: 'USER',
        isVerified: true
      }
    });

    try {
      // 1. Add comment to publicPost
      console.log("Adding comment to creator's public post for moderation testing...");
      const newComment = await postService.addComment(modCommentUser.id, publicPost.id, 'Spam comment to be moderated');
      
      // 2. Fetch comments as creator
      console.log("Fetching all creator comments (should include the spam comment)...");
      const creatorComments = await creatorService.getCreatorComments(creator.id);
      console.log("Total creator comments fetched:", creatorComments.length);
      const commentFound = creatorComments.some(c => c.id === newComment.id);
      console.log("Did we find the new comment in creator comments?", commentFound);

      // 3. Delete the comment as the creator (moderation)
      console.log("Deleting/Moderating the comment as the creator...");
      await creatorService.deleteCreatorComment(creator.id, newComment.id);
      console.log("Comment successfully moderated!");

      // 4. Try to fetch comments again and verify it is deleted
      const creatorCommentsPostMod = await creatorService.getCreatorComments(creator.id);
      const commentFoundPostMod = creatorCommentsPostMod.some(c => c.id === newComment.id);
      console.log("Is comment still present after moderation? (should be false):", commentFoundPostMod);

      // 5. Verify that another user trying to moderate throws an error
      console.log("Verifying unauthorized moderation throws error...");
      const unauthorizedComment = await postService.addComment(modCommentUser.id, publicPost.id, 'Another comment');
      try {
        await creatorService.deleteCreatorComment(modCommentUser.id, unauthorizedComment.id); // modCommentUser is not a creator or owner
        console.log("Error: Managed to moderate comment as unauthorized user!");
      } catch (err) {
        console.log("Success: Moderation denied caught as expected! Message:", err.message);
      }

      // Cleanup the unauthorized comment
      await postService.removeComment(modCommentUser.id, unauthorizedComment.id);

    } finally {
      await prisma.user.delete({
        where: { id: modCommentUser.id }
      });
    }

    console.log("API Tests completed successfully!");

  } catch (error) {
    console.error("Test failed with error:", error);
  } finally {
    await prisma.$disconnect();
    console.log("Disconnected from Prisma.");
  }
}

test();
