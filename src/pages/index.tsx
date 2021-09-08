import { useState } from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../services/prismic';

import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [nextPosts, setNextPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState<string | null>(
    postsPagination.next_page
  );

  function formatDate(date: string) {
    return format(new Date(date), 'dd MMM yyyy', { locale: ptBR });
  }

  async function handleSeeMore() {
    try {
      const response = await fetch(nextPage);
      const data = await response.json();

      setNextPage(data.next_page);

      const posts: Post[] = data.results.map(
        post =>
          ({
            uid: post.uid,
            data: {
              author: post.data.author,
              title: post.data.title,
              subtitle: post.data.subtitle,
            },
            first_publication_date: post.first_publication_date,
          } as Post)
      );

      setNextPosts(prevState => [...prevState, ...posts]);
    } catch (err) {
      throw new Error(err);
    }
  }

  return (
    <>
      <Head>
        <title>Posts | Spacetraveling</title>
      </Head>

      <main className={styles.container}>
        <img src="/logo.svg" alt="logo" />

        {nextPosts.map((post: Post) => (
          <div key={post.uid} className={styles.post}>
            <Link href={`/post/${post.uid}`}>
              <a>
                <h1>{post.data.title}</h1>
              </a>
            </Link>
            <p>{post.data.subtitle}</p>
            <div className={styles.postInfo}>
              <span>
                <FiCalendar color="#BBBBBB" size={20} />
                {formatDate(post.first_publication_date)}
              </span>
              <span>
                <FiUser color="#BBBBBB" size={20} />
                {post.data.author}
              </span>
            </div>
          </div>
        ))}

        {nextPage !== null && (
          <button type="button" onClick={handleSeeMore}>
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 1,
    }
  );

  // console.log(JSON.stringify(postsResponse, null, 2));

  const posts = postsResponse.results.map(
    post =>
      ({
        uid: post.uid,
        data: {
          author: post.data.author,
          title: post.data.title,
          subtitle: post.data.subtitle,
        },
        first_publication_date: post.first_publication_date,
      } as Post)
  );

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      } as PostPagination,
    },
    revalidate: 60 * 60 * 24, // 1 day
  };
};
