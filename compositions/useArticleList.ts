import { reactive, useContext, watch } from '@nuxtjs/composition-api'
import useUser from './useUser'
import { ArticleListRequest } from '~/api/articleRepository'
import { Article, Tag, User } from '~/types'

type FeedType = 'GLOBAL' | 'YOUR'
export type PostType = 'AUTHOR' | 'FAVORITED'

type State = {
  articleList: Article[]
  articleCount: number
  feedType: FeedType
  postType: PostType
}

const state = reactive<State>({
  articleList: [],
  articleCount: 0,
  feedType: 'GLOBAL',
  postType: 'AUTHOR',
})

export default function useArticleList() {
  const { $repository, redirect } = useContext()
  const { isLogin } = useUser()

  const setFeedType = (type: FeedType) => {
    state.feedType = type
  }

  const setPostType = (type: PostType) => {
    state.postType = type
  }

  const getArticleList = async (payload: ArticleListRequest = {}) => {
    const {
      articles,
      articlesCount,
    } = await $repository.article.getArticleList(payload)

    state.articleList = articles
    state.articleCount = articlesCount
  }

  const getFeedArticleList = async () => {
    const {
      articles,
      articlesCount,
    } = await $repository.article.getFeedArticleList()

    state.articleList = articles
    state.articleCount = articlesCount
  }

  const getArticleListByTag = async (tag: Tag) => {
    const {
      articles,
      articlesCount,
    } = await $repository.article.getArticleList({ tag })

    state.articleList = articles
    state.articleCount = articlesCount
  }

  const getArticleListByFeed = async (listType: FeedType) => {
    const fetchArticleBy = {
      GLOBAL: getArticleList,
      YOUR: getFeedArticleList,
    }

    await fetchArticleBy[listType]()

    setFeedType(listType)
  }

  const getArticleListByPost = async ({
    userName,
    postType = 'AUTHOR',
  }: {
    userName: User['username']
    postType: PostType
  }) => {
    await getArticleList({
      [postType.toLowerCase()]: userName,
    })

    setPostType(postType)
  }

  const fetchToggleFavorite = async (articleIndex: number) => {
    if (!isLogin.value) {
      redirect('/login')

      return
    }

    const selectedArticle = state.articleList[articleIndex]
    const response = selectedArticle?.favorited
      ? await $repository.article.unFavoriteArticle(selectedArticle.slug)
      : await $repository.article.favoriteArticle(selectedArticle.slug)

    if (response.article) {
      state.articleList = [
        ...state.articleList.slice(0, articleIndex),
        response.article,
        ...state.articleList.slice(articleIndex + 1),
      ]
    }
  }

  watch(isLogin, (isLogin, prevIsLogin) => {
    if (!prevIsLogin && isLogin) {
      setFeedType('YOUR')

      return
    }

    if (!isLogin && prevIsLogin) {
      setFeedType('GLOBAL')
    }
  })

  return {
    state,
    getArticleList,
    getFeedArticleList,
    getArticleListByTag,
    getArticleListByFeed,
    getArticleListByPost,
    fetchToggleFavorite,
    setFeedType,
    setPostType,
  }
}
