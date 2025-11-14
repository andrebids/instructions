import React from "react";

export function PageTitle({
  title,
  userName = "Christopher",
  subtitle,
  meta,
  className = "",
  showWelcome = false,
  lead,
}) {
  return (
    <div className={className}>
      {title ? (
        <div className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground mb-1">{title}</div>
      ) : null}
      {showWelcome ? (
        <h1 className="text-xl md:text-2xl text-foreground">
          <span className="font-normal text-default-500">Welcome back, </span>
          <span className="font-semibold">{userName}</span>
        </h1>
      ) : lead ? (
        (() => {
          const i = String(lead).indexOf(String(userName));
          if (i >= 0) {
            return (
              <h2 className="text-xl md:text-2xl text-foreground">
                {lead.slice(0, i)}
                <span className="font-semibold">{userName}</span>
                {lead.slice(i + String(userName).length)}
              </h2>
            );
          }
          return <h2 className="text-xl md:text-2xl text-foreground">{lead}</h2>;
        })()
      ) : null}
      {subtitle ? <p className="mt-1 text-default-600 dark:text-default-500">{subtitle}</p> : null}
      {meta ? <p className="mt-1 text-xs text-default-500 dark:text-default-400">{meta}</p> : null}
    </div>
  );
}


