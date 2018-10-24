import * as React from "react";
import page from "page";
import { parse } from "query-string";

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;

type Subtract<T, K> = Omit<T, keyof K>;

type StringDictionary = {
  [param: string]: string;
};

type Context = {
  currentRoute: string;
  params: StringDictionary;
  query: StringDictionary;
  path: string;
  canonicalPath: string;
  redirect: (url: string) => void;
  show: (url: string) => void;
  stop: () => void;
};

const RouterContext = React.createContext<Context>(null);

type Props = {
  routes: {
    [route: string]: string;
  };
  redirects?: {
    [route: string]: string;
  };
  options?: {
    click?: boolean;
    popstate?: boolean;
    dispatch?: boolean;
    hashbang?: boolean;
    decodeURLComponents?: boolean;
  };
  baseUrl?: string;
};

type State = Context;

export class RouterProvider extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      currentRoute: null,
      params: {},
      query: {},
      path: null,
      canonicalPath: null,
      redirect: this.redirect,
      show: this.show,
      stop: this.stop
    };
  }
  componentDidMount() {
    Object.keys(this.props.routes).forEach(route =>
      page(route, this.createRoute(this.props.routes[route]))
    );

    if (this.props.baseUrl) {
      page.base(this.props.baseUrl);
    }

    page.start(this.props.options);
  }
  createRoute(route: string) {
    return context => {
      this.setState({
        currentRoute: route,
        params: context.params,
        query: parse(context.querystring || {}),
        path: context.path,
        canonicalPath: context.canonicalPath
      });
    };
  }
  redirect = (url: string) => {
    page.redirect(url);
  };
  show = (url: string) => {
    page.show(url);
  };
  stop = () => {
    page.stop();
  };
  render() {
    return (
      <RouterContext.Provider value={this.state}>
        {this.state.currentRoute ? this.props.children : null}
      </RouterContext.Provider>
    );
  }
}

export const Router = RouterContext.Consumer;

export type WithRouter = {
  router: Context;
};

type TConnect = <T extends WithRouter>(
  Component: React.ComponentType<T>
) => React.SFC<Subtract<T, WithRouter>>;

export const connectRouter: TConnect = Component => props => (
  <RouterContext.Consumer>
    {router => <Component {...props} router={router} />}
  </RouterContext.Consumer>
);
