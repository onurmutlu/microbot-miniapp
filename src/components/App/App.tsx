import React from "react";
import clsx from "clsx";
import styles from "./App.module.scss";

import MessageTemplates from "../../pages/MessageTemplates";

export type AppProps = {
  className?: string;
};

export const App: React.FC<AppProps> = ({ className }) => {
  return (
    <div className={clsx(styles.App, className)}>
      <div className={styles.container}>
        <MessageTemplates />
      </div>
    </div>
  );
};
