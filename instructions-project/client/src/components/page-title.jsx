import React from "react";

export function PageTitle({
  title,
  userName = "Christopher",
  subtitle,
  meta,
  className = "",
}) {
  return (
    <div className={className}>
      {title ? (
        <div className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground mb-1">{title}</div>
      ) : null}
      <h1 className="text-xl md:text-2xl text-foreground">
        <span className="font-normal text-default-500">Welcome back, </span>
        <span className="font-semibold">{userName}</span>
      </h1>
      {subtitle ? <p className="text-default-500 mt-1">{subtitle}</p> : null}
      {meta ? <p className="text-xs text-default-400 mt-1">{meta}</p> : null}
    </div>
  );
}


