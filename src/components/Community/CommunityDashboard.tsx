import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";
import { 
  MessageSquare, 
  PenSquare, 
  Heart, 
  MessageCircle, 
  Eye,
  TrendingUp,
  Clock,
  Pin,
  Search,
  X,
  Send,
  Sparkles,
  ThumbsUp,
  Share2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CommunityDashboardProps {
  onViewRanking?: (type: string) => void;
}

// Mock data
const mockPosts = [
  {
    id: 1,
    title: "정보처리기사 실기 합격 후기! 🎉",
    content: "드디어 합격했습니다! 이 플랫폼 덕분에 효율적으로 공부할 수 있었어요. 특히 AI 해설 기능이...",
    author: "합격왕",
    authorId: "user123",
    isAnonymous: false,
    category: "후기",
    likes: 42,
    comments: 15,
    views: 234,
    createdAt: "2시간 전",
    isPinned: true,
    isLiked: false,
  },
  {
    id: 2,
    title: "토익 문법 팁 공유합니다",
    content: "제가 토익 공부하면서 정리한 문법 팁 공유해요. 시제 파트가 제일 중요한데요...",
    author: "익명",
    authorId: "anonymous",
    isAnonymous: true,
    category: "꿀팁",
    likes: 28,
    comments: 8,
    views: 156,
    createdAt: "5시간 전",
    isPinned: false,
    isLiked: true,
  },
  {
    id: 3,
    title: "같이 스터디 하실 분 구해요!",
    content: "정보처리기사 준비하시는 분들 같이 스터디 하면 좋을 것 같아서 글 남겨요. 주 3회 정도...",
    author: "스터디러버",
    authorId: "user456",
    isAnonymous: false,
    category: "스터디",
    likes: 19,
    comments: 12,
    views: 98,
    createdAt: "1일 전",
    isPinned: false,
    isLiked: false,
  },
  {
    id: 4,
    title: "배틀 모드 너무 재밌어요 ⚔️",
    content: "처음엔 긴장됐는데 하다보니 진짜 재밌네요! 실력도 늘고 경쟁심도 생기고...",
    author: "익명",
    authorId: "anonymous2",
    isAnonymous: true,
    category: "자유",
    likes: 35,
    comments: 6,
    views: 187,
    createdAt: "1일 전",
    isPinned: false,
    isLiked: false,
  },
  {
    id: 5,
    title: "약점 분석 기능 진짜 좋네요",
    content: "제가 어떤 부분이 약한지 바로 알 수 있어서 집중적으로 공부하기 좋아요!",
    author: "공부중독",
    authorId: "user789",
    isAnonymous: false,
    category: "후기",
    likes: 24,
    comments: 4,
    views: 142,
    createdAt: "2일 전",
    isPinned: false,
    isLiked: false,
  },
];

const mockComments = [
  {
    id: 1,
    postId: 1,
    author: "축하해요123",
    authorId: "user999",
    isAnonymous: false,
    isAuthor: false,
    content: "축하드려요! 저도 곧 시험인데 힘이 나네요 💪",
    likes: 5,
    createdAt: "1시간 전",
    isLiked: false,
  },
  {
    id: 2,
    postId: 1,
    author: "합격왕",
    authorId: "user123",
    isAnonymous: false,
    isAuthor: true,
    content: "감사합니다! 여러분도 꼭 합격하세요 ✨",
    likes: 8,
    createdAt: "30분 전",
    isLiked: true,
  },
  {
    id: 3,
    postId: 1,
    author: "익명",
    authorId: "anonymous3",
    isAnonymous: true,
    isAuthor: false,
    content: "혹시 실기 준비 기간은 얼마나 하셨나요?",
    likes: 2,
    createdAt: "15분 전",
    isLiked: false,
  },
];

export function CommunityDashboard({ onViewRanking }: CommunityDashboardProps) {
  const [mainTab, setMainTab] = useState("board"); // board or myActivity
  const [activeTab, setActiveTab] = useState("all");
  const [showWritePost, setShowWritePost] = useState(false);
  const [selectedPost, setSelectedPost] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [myActivityTab, setMyActivityTab] = useState("posts"); // posts or comments
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [myPostsPage, setMyPostsPage] = useState(1);
  const [myCommentsPage, setMyCommentsPage] = useState(1);
  const postsPerPage = 10;
  
  // Post write form
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postCategory, setPostCategory] = useState("자유");
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  // Comment form
  const [commentText, setCommentText] = useState("");
  const [commentAnonymous, setCommentAnonymous] = useState(false);

  const categories = ["전체", "후기", "꿀팁", "스터디", "질문", "자유"];
  const currentUserId = "user123"; // Current logged-in user

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "후기": return "bg-green-100 text-green-700 border-green-300";
      case "꿀팁": return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "스터디": return "bg-blue-100 text-blue-700 border-blue-300";
      case "질문": return "bg-purple-100 text-purple-700 border-purple-300";
      default: return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const filteredPosts = mockPosts.filter(post => {
    if (activeTab !== "all" && post.category !== activeTab) return false;
    if (searchQuery && !post.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Get user's posts and comments
  const myPosts = mockPosts.filter(post => post.authorId === currentUserId);
  const myComments = mockComments.filter(comment => comment.authorId === currentUserId);

  // Pagination calculations
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const totalMyPostsPages = Math.ceil(myPosts.length / postsPerPage);
  const totalMyCommentsPages = Math.ceil(myComments.length / postsPerPage);
  
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);

  const indexOfLastMyPost = myPostsPage * postsPerPage;
  const indexOfFirstMyPost = indexOfLastMyPost - postsPerPage;
  const currentMyPosts = myPosts.slice(indexOfFirstMyPost, indexOfLastMyPost);

  const indexOfLastMyComment = myCommentsPage * postsPerPage;
  const indexOfFirstMyComment = indexOfLastMyComment - postsPerPage;
  const currentMyComments = myComments.slice(indexOfFirstMyComment, indexOfLastMyComment);

  const currentPost = selectedPost ? mockPosts.find(p => p.id === selectedPost) : null;
  const postComments = selectedPost ? mockComments.filter(c => c.postId === selectedPost) : [];

  // Reset page when filters change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Pagination helper function
  const renderPagination = (currentPageNum: number, totalPagesNum: number, onPageChange: (page: number) => void) => {
    if (totalPagesNum === 0) return null;

    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPagesNum <= maxVisible) {
      for (let i = 1; i <= totalPagesNum; i++) {
        pages.push(i);
      }
    } else {
      if (currentPageNum <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("ellipsis");
        pages.push(totalPagesNum);
      } else if (currentPageNum >= totalPagesNum - 2) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = totalPagesNum - 3; i <= totalPagesNum; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = currentPageNum - 1; i <= currentPageNum + 1; i++) pages.push(i);
        pages.push("ellipsis");
        pages.push(totalPagesNum);
      }
    }

    return (
      <Pagination className="mt-6">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => currentPageNum > 1 && onPageChange(currentPageNum - 1)}
              className={currentPageNum === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          
          {pages.map((page, idx) => (
            <PaginationItem key={idx}>
              {page === "ellipsis" ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  onClick={() => onPageChange(page as number)}
                  isActive={currentPageNum === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}
          
          <PaginationItem>
            <PaginationNext
              onClick={() => currentPageNum < totalPagesNum && onPageChange(currentPageNum + 1)}
              className={currentPageNum === totalPagesNum ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="w-8 h-8 text-purple-600" />
            <h1 className="text-purple-900">커뮤니티 게시판</h1>
          </div>
          <p className="text-gray-600">함께 공부하며 정보를 나눠요! ✨</p>
        </div>

        {/* Write Post Modal */}
        <AnimatePresence>
          {showWritePost && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowWritePost(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-purple-900">✍️ 게시글 작성</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowWritePost(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Category Selection */}
                  <div>
                    <Label className="mb-2">카테고리</Label>
                    <div className="flex flex-wrap gap-2">
                      {categories.filter(c => c !== "전체").map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setPostCategory(cat)}
                          className={`px-4 py-2 rounded-lg border-2 transition-all ${
                            postCategory === cat
                              ? "border-purple-500 bg-purple-50 text-purple-700"
                              : "border-gray-200 hover:border-purple-300"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <Label className="mb-2">제목</Label>
                    <Input
                      placeholder="제목을 입력하세요"
                      value={postTitle}
                      onChange={(e) => setPostTitle(e.target.value)}
                      className="border-purple-200 focus:border-purple-400"
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <Label className="mb-2">내용</Label>
                    <Textarea
                      placeholder="내용을 입력하세요..."
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      className="min-h-[200px] border-purple-200 focus:border-purple-400"
                    />
                  </div>

                  {/* Anonymous Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">🎭</div>
                      <div>
                        <Label htmlFor="anonymous">익명으로 작성</Label>
                        <p className="text-sm text-gray-600">내 닉네임을 숨길 수 있어요</p>
                      </div>
                    </div>
                    <Switch
                      id="anonymous"
                      checked={isAnonymous}
                      onCheckedChange={setIsAnonymous}
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={() => {
                      // Submit logic here
                      setShowWritePost(false);
                      setPostTitle("");
                      setPostContent("");
                      setIsAnonymous(false);
                    }}
                    disabled={!postTitle || !postContent}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-6"
                  >
                    <PenSquare className="w-4 h-4 mr-2" />
                    게시글 작성하기
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Post Detail Modal */}
        <AnimatePresence>
          {selectedPost && currentPost && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedPost(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              >
                {/* Post Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={`${getCategoryColor(currentPost.category)} border`}>
                        {currentPost.category}
                      </Badge>
                      {currentPost.isPinned && (
                        <Badge className="bg-red-100 text-red-700 border-red-300">
                          <Pin className="w-3 h-3 mr-1" />
                          공지
                        </Badge>
                      )}
                    </div>
                    <h2 className="text-gray-900 mb-3">{currentPost.title}</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{currentPost.author}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {currentPost.createdAt}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {currentPost.views}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPost(null)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Post Content */}
                <div className="mb-6 p-6 bg-gray-50 rounded-lg">
                  <p className="text-gray-800 whitespace-pre-wrap">{currentPost.content}</p>
                </div>

                {/* Post Actions */}
                <div className="flex items-center gap-3 mb-8 pb-6 border-b">
                  <Button
                    variant="outline"
                    className={`flex-1 ${
                      currentPost.isLiked 
                        ? "border-pink-300 bg-pink-50 text-pink-700" 
                        : "border-gray-200 hover:border-pink-300"
                    }`}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${currentPost.isLiked ? "fill-pink-500 text-pink-500" : ""}`} />
                    좋아요 {currentPost.likes}
                  </Button>
                  <Button variant="outline" className="flex-1 border-gray-200">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    댓글 {currentPost.comments}
                  </Button>
                  <Button variant="outline" className="border-gray-200">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Comments Section */}
                <div>
                  <h3 className="text-purple-900 mb-4">💬 댓글 {postComments.length}</h3>

                  {/* Comment List */}
                  <div className="space-y-4 mb-6">
                    {postComments.map((comment) => (
                      <div key={comment.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-900">{comment.author}</span>
                              {comment.isAuthor && (
                                <Badge className="bg-purple-500 text-white text-xs px-2 py-0">
                                  작성자
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">{comment.createdAt}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`text-xs ${
                              comment.isLiked ? "text-pink-600" : "text-gray-500"
                            }`}
                          >
                            <ThumbsUp className={`w-3 h-3 mr-1 ${comment.isLiked ? "fill-pink-500" : ""}`} />
                            {comment.likes}
                          </Button>
                        </div>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                      </div>
                    ))}
                  </div>

                  {/* Comment Write */}
                  <div className="space-y-3">
                    <Textarea
                      placeholder="댓글을 입력하세요..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="border-purple-200 focus:border-purple-400"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          id="comment-anonymous"
                          checked={commentAnonymous}
                          onCheckedChange={setCommentAnonymous}
                        />
                        <Label htmlFor="comment-anonymous" className="text-sm cursor-pointer">
                          익명
                        </Label>
                      </div>
                      <Button
                        disabled={!commentText}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        댓글 작성
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Tabs - Board / My Activity */}
        <Tabs value={mainTab} onValueChange={setMainTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur border-2 border-purple-200">
            <TabsTrigger value="board" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
              📋 게시판
            </TabsTrigger>
            <TabsTrigger value="myActivity" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
              ✍️ 내 활동
            </TabsTrigger>
          </TabsList>

          <TabsContent value="board" className="mt-6">
            {/* Top Navigation Bar */}
            <Card className="p-4 border-2 border-purple-200 bg-white/80 backdrop-blur mb-6">
              <div className="flex flex-col md:flex-row items-center gap-4">
                {/* Categories */}
                <div className="flex-1 flex flex-wrap items-center gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleTabChange(cat === "전체" ? "all" : cat)}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        (cat === "전체" && activeTab === "all") || activeTab === cat
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Write Button */}
                <Button
                  onClick={() => setShowWritePost(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg whitespace-nowrap"
                >
                  <PenSquare className="w-4 h-4 mr-2" />
                  글쓰기
                </Button>
              </div>
            </Card>

            {/* Main Content - Post List */}
            <div className="space-y-4">
              {/* Search Bar */}
              <Card className="p-4 border-2 border-purple-200 bg-white/80 backdrop-blur">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="게시글 검색..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10 border-purple-200 focus:border-purple-400"
                  />
                </div>
              </Card>

              {/* Popular Posts Banner */}
              <Card className="p-6 border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  <h3 className="text-orange-900">🔥 인기 게시글</h3>
                </div>
                <div className="space-y-2">
                  {mockPosts.slice(0, 3).map((post, idx) => (
                    <button
                      key={post.id}
                      onClick={() => setSelectedPost(post.id)}
                      className="w-full text-left text-sm text-gray-700 hover:text-orange-700 transition-colors"
                    >
                      {idx + 1}. {post.title}
                    </button>
                  ))}
                </div>
              </Card>

              {/* Post List */}
              <div className="space-y-3">
                {currentPosts.map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <Card
                      className={`p-6 border-2 cursor-pointer transition-all hover:shadow-lg ${
                        post.isPinned
                          ? "border-red-200 bg-gradient-to-r from-red-50 to-pink-50"
                          : "border-purple-200 bg-white/80 backdrop-blur hover:border-purple-300"
                      }`}
                      onClick={() => setSelectedPost(post.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Badges */}
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={`${getCategoryColor(post.category)} border`}>
                              {post.category}
                            </Badge>
                            {post.isPinned && (
                              <Badge className="bg-red-100 text-red-700 border-red-300">
                                <Pin className="w-3 h-3 mr-1" />
                                공지
                              </Badge>
                            )}
                          </div>

                          {/* Title */}
                          <h3 className="text-gray-900 mb-3">
                            {post.title}
                          </h3>

                          {/* Meta Info */}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{post.author}</span>
                            <span>•</span>
                            <span>{post.createdAt}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {post.views}
                            </span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex flex-col items-end gap-2 text-sm">
                          <div className="flex items-center gap-1 text-pink-600">
                            <Heart className={`w-4 h-4 ${post.isLiked ? "fill-pink-500" : ""}`} />
                            <span>{post.likes}</span>
                          </div>
                          <div className="flex items-center gap-1 text-blue-600">
                            <MessageCircle className="w-4 h-4" />
                            <span>{post.comments}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}

                {currentPosts.length === 0 && (
                  <Card className="p-12 text-center border-2 border-purple-200 bg-white/80">
                    <div className="text-5xl mb-4">📭</div>
                    <p className="text-gray-600">게시글이 없습니다</p>
                  </Card>
                )}
              </div>

              {/* Pagination */}
              {renderPagination(currentPage, totalPages, setCurrentPage)}
            </div>
          </TabsContent>

          <TabsContent value="myActivity" className="mt-6">
            {/* My Activity Tabs */}
            <Card className="p-4 border-2 border-purple-200 bg-white/80 backdrop-blur mb-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMyActivityTab("posts")}
                  className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                    myActivityTab === "posts"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  📝 내가 쓴 글 ({myPosts.length})
                </button>
                <button
                  onClick={() => setMyActivityTab("comments")}
                  className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                    myActivityTab === "comments"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  💬 내가 쓴 댓글 ({myComments.length})
                </button>
              </div>
            </Card>

            <div className="space-y-4">
              {/* My Posts */}
              {myActivityTab === "posts" && (
                <>
                  <div className="space-y-3">
                    {currentMyPosts.map((post) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.01 }}
                    >
                      <Card
                        className="p-6 border-2 cursor-pointer transition-all hover:shadow-lg border-purple-200 bg-white/80 backdrop-blur hover:border-purple-300"
                        onClick={() => setSelectedPost(post.id)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Badges */}
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={`${getCategoryColor(post.category)} border`}>
                                {post.category}
                              </Badge>
                            </div>

                            {/* Title Only */}
                            <h3 className="text-gray-900 mb-3">
                              {post.title}
                            </h3>

                            {/* Meta Info */}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{post.author}</span>
                              <span>•</span>
                              <span>{post.createdAt}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {post.views}
                              </span>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="flex flex-col items-end gap-2 text-sm">
                            <div className="flex items-center gap-1 text-pink-600">
                              <Heart className={`w-4 h-4 ${post.isLiked ? "fill-pink-500" : ""}`} />
                              <span>{post.likes}</span>
                            </div>
                            <div className="flex items-center gap-1 text-blue-600">
                              <MessageCircle className="w-4 h-4" />
                              <span>{post.comments}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                    ))}

                    {currentMyPosts.length === 0 && (
                      <Card className="p-12 text-center border-2 border-purple-200 bg-white/80">
                        <div className="text-5xl mb-4">📝</div>
                        <p className="text-gray-600">작성한 글이 없습니다</p>
                      </Card>
                    )}
                  </div>
                  
                  {/* Pagination */}
                  {renderPagination(myPostsPage, totalMyPostsPages, setMyPostsPage)}
                </>
              )}

              {/* My Comments */}
              {myActivityTab === "comments" && (
                <>
                  <div className="space-y-3">
                    {currentMyComments.map((comment) => {
                    const relatedPost = mockPosts.find(p => p.id === comment.postId);
                    return (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.01 }}
                      >
                        <Card
                          className="p-6 border-2 cursor-pointer transition-all hover:shadow-lg border-purple-200 bg-white/80 backdrop-blur hover:border-purple-300"
                          onClick={() => relatedPost && setSelectedPost(relatedPost.id)}
                        >
                          {relatedPost && (
                            <div className="mb-3 pb-3 border-b border-gray-200">
                              <p className="text-sm text-gray-500 mb-1">댓글 단 게시글</p>
                              <p className="text-sm text-gray-900">{relatedPost.title}</p>
                            </div>
                          )}
                          
                          <div className="mb-3">
                            <p className="text-gray-800">{comment.content}</p>
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-4">
                              <span>{comment.author}</span>
                              <span>•</span>
                              <span>{comment.createdAt}</span>
                            </div>
                            <div className="flex items-center gap-1 text-pink-600">
                              <ThumbsUp className={`w-3 h-3 ${comment.isLiked ? "fill-pink-500" : ""}`} />
                              <span>{comment.likes}</span>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                    })}

                    {currentMyComments.length === 0 && (
                      <Card className="p-12 text-center border-2 border-purple-200 bg-white/80">
                        <div className="text-5xl mb-4">💬</div>
                        <p className="text-gray-600">작성한 댓글이 없습니다</p>
                      </Card>
                    )}
                  </div>

                  {/* Pagination */}
                  {renderPagination(myCommentsPage, totalMyCommentsPages, setMyCommentsPage)}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
