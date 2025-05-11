import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { getTestMode } from '../../utils/testMode';
import { getApiUrl } from '../../utils/env';

// API URL yapılandırması - env.ts'den aldığımız URL'i kullanıyoruz
const httpLink = createHttpLink({
  uri: `${getApiUrl()}/graphql`,
});

// Yetkilendirme Link'i
const authLink = setContext((_, { headers }) => {
  // localStorage'dan token al
  const token = localStorage.getItem('access_token');
  
  // Headerlara token ekle
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  };
});

// Hata işleme Link'i
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }
  
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
    
    // Test modunda hata yokmuş gibi davran
    if (getTestMode()) {
      console.info('Test modu aktif: GraphQL ağ hatası yoksayıldı');
    }
  }
});

// Önbellek yapılandırması
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // Alan ve tip bazlı önbellek yapılandırmaları buraya eklenebilir
        group_content_insights: {
          merge: true,
        },
        system_metrics: {
          merge: true,
        }
      }
    }
  }
});

// Apollo Client yapılandırması ve oluşturma
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
  connectToDevTools: import.meta.env.DEV, // Sadece geliştirme ortamında DevTools bağlantısı
}); 