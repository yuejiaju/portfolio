(() => {
  "use strict";

  const body = document.body;
  const page = document.querySelector(".page");
  const mobileBar = document.querySelector(".mobile-bar");
  const rail = document.querySelector(".rail");
  const scrim = document.querySelector(".menu-scrim");
  const menuToggle = document.querySelector(".menu-toggle");
  const railClose = document.querySelector(".rail__close");
  const progressBars = Array.from(document.querySelectorAll(".js-progress-bar"));
  const tocLinks = Array.from(document.querySelectorAll(".toc__link"));
  const mobileQuery = window.matchMedia("(max-width: 900px)");
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const revealElements = Array.from(document.querySelectorAll(".reveal"));

  const QUALITY_SUFFIX = { hd: "-hd", sd: "-sd", original: "" };
  let preferredQuality = window.matchMedia("(max-width: 640px)").matches
    ? "sd"
    : "hd";

  function getQualitySource(source, quality = preferredQuality) {
    if (!source) return source;
    return source.replace(
      /\.mp4(\?.*)?$/i,
      `${QUALITY_SUFFIX[quality] ?? ""}.mp4$1`
    );
  }

  function setPreferredQuality(quality) {
    preferredQuality = quality;
    document.querySelectorAll(".quality-control__select").forEach((select) => {
      select.value = quality;
    });
  }

  function bindQualitySelect(select, onChange) {
    if (!select) return;

    select.value = preferredQuality;
    select.addEventListener("change", () => {
      setPreferredQuality(select.value);
      onChange(select.value);
    });
  }

  function loadVideoSource(video, source, options = {}) {
    const { poster, resume = false, play = false } = options;
    const currentTime = resume ? video.currentTime : 0;
    const shouldPlay = resume ? !video.paused : play;

    if (poster !== undefined) {
      video.poster = poster;
    }

    const restore = () => {
      video.removeEventListener("loadedmetadata", restore);
      if (currentTime > 0 && Number.isFinite(video.duration)) {
        try {
          video.currentTime = Math.min(
            currentTime,
            Math.max(0, video.duration - 0.15)
          );
        } catch {
          // Ignore seek errors on sources that cannot seek yet.
        }
      }
      if (shouldPlay) {
        const playAttempt = video.play();
        if (playAttempt && typeof playAttempt.catch === "function") {
          playAttempt.catch(() => {
            // Native controls remain available if playback is blocked.
          });
        }
      }
    };

    video.addEventListener("loadedmetadata", restore);
    video.src = source;
    video.load();
  }

  document.querySelectorAll("video").forEach((video) => {
    video.setAttribute("controlsList", "nodownload");
    video.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });
  });

  let menuOpen = false;
  let scrollTicking = false;

  const sectionItems = tocLinks
    .map((link) => {
      const id = link.dataset.section;
      const element = id ? document.getElementById(id) : null;
      return element ? { id, element, link } : null;
    })
    .filter(Boolean);

  function isMobile() {
    return mobileQuery.matches;
  }

  function syncRailAccessibility() {
    const hidden = isMobile() && !menuOpen;
    rail.inert = hidden;
    if (hidden) {
      rail.setAttribute("aria-hidden", "true");
    } else {
      rail.removeAttribute("aria-hidden");
    }
  }

  function setMenu(open) {
    if (!isMobile()) {
      open = false;
    }

    menuOpen = open;
    body.classList.toggle("menu-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    scrim.setAttribute("aria-hidden", String(!open));

    page.inert = open;
    mobileBar.inert = open;

    if (open) {
      railClose.focus({ preventScroll: true });
    } else {
      menuToggle.focus({ preventScroll: true });
    }

    syncRailAccessibility();
  }

  menuToggle.addEventListener("click", () => {
    setMenu(!menuOpen);
  });

  railClose.addEventListener("click", () => {
    setMenu(false);
  });

  scrim.addEventListener("click", () => {
    setMenu(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuOpen) {
      setMenu(false);
    }
  });

  tocLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (isMobile()) {
        setMenu(false);
      }
    });
  });

  mobileBar.querySelector(".mobile-brand").addEventListener("click", () => {
    if (menuOpen) {
      setMenu(false);
    }
  });

  mobileQuery.addEventListener("change", () => {
    setMenu(false);
    syncRailAccessibility();
  });

  syncRailAccessibility();

  function updateScrollUI() {
    scrollTicking = false;

    const scrollTop = window.scrollY || window.pageYOffset;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? Math.min(1, Math.max(0, scrollTop / scrollable)) : 0;

    progressBars.forEach((bar) => {
      bar.style.transform = `scaleX(${progress})`;
    });

    const probe = scrollTop + Math.min(window.innerHeight * 0.36, 340);
    let current = null;

    for (const item of sectionItems) {
      const top = item.element.getBoundingClientRect().top + scrollTop;
      if (top <= probe) {
        current = item;
      } else {
        break;
      }
    }

    sectionItems.forEach((item) => {
      const active = item === current;
      item.link.classList.toggle("is-active", active);
      if (active) {
        item.link.setAttribute("aria-current", "true");
      } else {
        item.link.removeAttribute("aria-current");
      }
    });
  }

  function requestScrollUpdate() {
    if (!scrollTicking) {
      scrollTicking = true;
      window.requestAnimationFrame(updateScrollUI);
    }
  }

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate, { passive: true });
  window.addEventListener("load", requestScrollUpdate);
  updateScrollUI();

  if ("IntersectionObserver" in window && !reducedMotionQuery.matches) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: "0px 0px -7% 0px",
        threshold: 0.08,
      }
    );

    revealElements.forEach((element) => {
      revealObserver.observe(element);
    });
  } else {
    revealElements.forEach((element) => {
      element.classList.add("is-visible");
    });
  }

  reducedMotionQuery.addEventListener("change", (event) => {
    if (event.matches) {
      revealElements.forEach((element) => {
        element.classList.add("is-visible");
      });
    }
  });

  const dramaModal = document.getElementById("drama-modal");
  const dramaModalVideo = document.getElementById("drama-modal-video");
  const dramaModalIndex = document.getElementById("drama-modal-index");
  const dramaModalType = document.getElementById("drama-modal-type");
  const dramaModalClose = document.querySelector(".drama-modal__close");
  const dramaQuality = document.getElementById("drama-quality");
  const dramaCards = Array.from(document.querySelectorAll(".drama-card"));
  let lastDramaCard = null;
  let dramaBaseSource = "";

  if (dramaModal && dramaModalVideo && dramaModalIndex && dramaModalType && dramaModalClose) {
    dramaCards.forEach((card) => {
      card.addEventListener("click", () => {
        const videoSource = card.dataset.video;
        const poster = card.dataset.poster;

        if (!videoSource) {
          return;
        }

        lastDramaCard = card;
        dramaBaseSource = videoSource;
        dramaModalIndex.textContent = card.dataset.index || "01";
        dramaModalType.textContent = card.dataset.type || "";
        dramaModalVideo.poster = poster || "";
        dramaModalVideo.src = getQualitySource(videoSource);
        dramaModalVideo.load();
        document.body.classList.add("drama-modal-open");

        if (typeof dramaModal.showModal === "function") {
          dramaModal.showModal();
        } else {
          dramaModal.setAttribute("open", "");
        }

        dramaModalClose.focus({ preventScroll: true });

        const playAttempt = dramaModalVideo.play();
        if (playAttempt && typeof playAttempt.catch === "function") {
          playAttempt.catch(() => {
            // If autoplay is blocked, native video controls remain available.
          });
        }
      });
    });

    dramaModal.addEventListener("close", () => {
      document.body.classList.remove("drama-modal-open");
      dramaModalVideo.pause();
      dramaModalVideo.removeAttribute("src");
      dramaModalVideo.removeAttribute("poster");
      dramaModalVideo.load();

      if (lastDramaCard) {
        lastDramaCard.focus({ preventScroll: true });
        lastDramaCard = null;
      }
    });

    dramaModalClose.addEventListener("click", () => {
      dramaModal.close();
    });

    bindQualitySelect(dramaQuality, (quality) => {
      if (!dramaBaseSource) return;
      loadVideoSource(
        dramaModalVideo,
        getQualitySource(dramaBaseSource, quality),
        { resume: true }
      );
    });

    dramaModal.addEventListener("click", (event) => {
      if (event.target === dramaModal) {
        dramaModal.close();
      }
    });
  }

  const productTabs = Array.from(document.querySelectorAll(".product-tab"));
  const productPanel = document.getElementById("product-tabpanel");
  const productScreenButton = document.getElementById("product-screen-button");
  const productScreenImage = document.getElementById("product-screen-image");
  const productPanelKicker = document.getElementById("product-panel-kicker");
  const productPanelTitle = document.getElementById("product-panel-title");
  const productPanelDesc = document.getElementById("product-panel-desc");
  const productPanelPoints = document.getElementById("product-panel-points");
  const productLightbox = document.getElementById("product-lightbox");
  const productLightboxImage = document.getElementById("product-lightbox-image");
  const productLightboxCaption = document.getElementById("product-lightbox-caption");
  const productLightboxMeta = document.getElementById("product-lightbox-meta");
  const productLightboxLink = document.getElementById("product-lightbox-link");
  const productLightboxClose = document.querySelector(".product-lightbox__close");
  let lastProductTrigger = null;

  if (
    productTabs.length &&
    productPanel &&
    productScreenButton &&
    productScreenImage &&
    productPanelKicker &&
    productPanelTitle &&
    productPanelDesc &&
    productPanelPoints
  ) {
    const activeProductTab = () =>
      productTabs.find((tab) => tab.getAttribute("aria-selected") === "true") || productTabs[0];

    function selectProductTab(tab, moveFocus = false) {
      if (!tab) {
        return;
      }

      const label = tab.querySelector(".product-tab__label")?.textContent.trim() || "";
      const points = (tab.dataset.points || "").split("||").filter(Boolean);

      productTabs.forEach((item) => {
        const selected = item === tab;
        item.setAttribute("aria-selected", String(selected));
        item.tabIndex = selected ? 0 : -1;
      });

      productPanel.setAttribute("aria-labelledby", tab.id);
      productPanelKicker.textContent = tab.dataset.kicker || "";
      productPanelTitle.textContent = tab.dataset.title || "";
      productPanelDesc.textContent = tab.dataset.desc || "";
      productPanelPoints.replaceChildren(
        ...points.map((point) => {
          const item = document.createElement("li");
          item.textContent = point;
          return item;
        })
      );

      if (tab.dataset.screen) {
        productScreenImage.src = tab.dataset.screen;
        productScreenImage.alt = tab.dataset.alt || `${label}界面截图`;
      }

      productScreenButton.setAttribute("aria-label", `查看${label}界面大图`);

      const tabStrip = tab.parentElement;
      if (tabStrip && tabStrip.scrollWidth > tabStrip.clientWidth) {
        const targetLeft = tab.offsetLeft - (tabStrip.clientWidth - tab.offsetWidth) / 2;
        tabStrip.scrollTo({ left: Math.max(0, targetLeft), behavior: "smooth" });
      }

      if (moveFocus) {
        tab.focus();
      }
    }

    productTabs.forEach((tab, index) => {
      tab.addEventListener("click", () => {
        selectProductTab(tab);
      });

      tab.addEventListener("keydown", (event) => {
        let nextIndex = null;

        if (event.key === "ArrowRight") {
          nextIndex = (index + 1) % productTabs.length;
        } else if (event.key === "ArrowLeft") {
          nextIndex = (index - 1 + productTabs.length) % productTabs.length;
        } else if (event.key === "Home") {
          nextIndex = 0;
        } else if (event.key === "End") {
          nextIndex = productTabs.length - 1;
        }

        if (nextIndex !== null) {
          event.preventDefault();
          selectProductTab(productTabs[nextIndex], true);
        }
      });
    });

    if (
      productLightbox &&
      productLightboxImage &&
      productLightboxCaption &&
      productLightboxMeta &&
      productLightboxLink &&
      productLightboxClose
    ) {
      function openProductLightbox() {
        const tab = activeProductTab();
        const screen = tab.dataset.screen;
        const label = tab.querySelector(".product-tab__label")?.textContent.trim() || "";

        if (!screen) {
          return;
        }

        lastProductTrigger = productScreenButton;
        productLightboxImage.src = screen;
        productLightboxImage.alt = tab.dataset.alt || `${label}界面截图`;
        productLightboxCaption.textContent = `${label} / ${tab.dataset.title || ""}`;
        productLightboxMeta.textContent = tab.dataset.kicker || "";
        productLightboxLink.href = screen;
        document.body.classList.add("product-lightbox-open");

        if (typeof productLightbox.showModal === "function") {
          productLightbox.showModal();
        } else {
          productLightbox.setAttribute("open", "");
        }

        productLightboxClose.focus({ preventScroll: true });
      }

      productScreenButton.addEventListener("click", openProductLightbox);

      productLightboxClose.addEventListener("click", () => {
        productLightbox.close();
      });

      productLightbox.addEventListener("click", (event) => {
        if (event.target === productLightbox) {
          productLightbox.close();
        }
      });

      productLightbox.addEventListener("close", () => {
        document.body.classList.remove("product-lightbox-open");

        if (lastProductTrigger) {
          lastProductTrigger.focus({ preventScroll: true });
          lastProductTrigger = null;
        }
      });
    }
  }

  const gamePlayer = document.querySelector(".game-player");
  const gameVideo = document.getElementById("game-video");
  const gameQuality = document.getElementById("game-quality");
  const gameCuts = Array.from(document.querySelectorAll(".game-cut"));
  const gameCutIndex = document.getElementById("game-cut-index");
  const gamePlayCut = document.getElementById("game-play-cut");
  const gamePlayButton = document.getElementById("game-play-button");
  const gameCurrentTitle = document.getElementById("game-current-title");
  const gameCurrentDuration = document.getElementById("game-current-duration");

  if (
    gamePlayer &&
    gameVideo &&
    gameCuts.length &&
    gameCutIndex &&
    gamePlayCut &&
    gamePlayButton &&
    gameCurrentTitle &&
    gameCurrentDuration
  ) {
    let gameBaseSource =
      gameVideo.dataset.baseSrc || gameVideo.getAttribute("src") || "";

    if (gameBaseSource) {
      const initialSource = getQualitySource(gameBaseSource);
      if (gameVideo.getAttribute("src") !== initialSource) {
        gameVideo.src = initialSource;
        gameVideo.load();
      }
    }

    function playGameVideo() {
      const playAttempt = gameVideo.play();
      if (playAttempt && typeof playAttempt.catch === "function") {
        playAttempt.catch(() => {
          // Keep the custom play overlay visible if autoplay is blocked.
        });
      }
    }

    function selectGameCut(cut, shouldPlay = true) {
      const cutNumber = cut.dataset.cut || "01";
      const title = cut.dataset.title || `买量素材 ${cutNumber}`;
      const source = cut.dataset.src;
      const poster = cut.dataset.poster;

      if (!source) {
        return;
      }

      gameCuts.forEach((item) => {
        const active = item === cut;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });

      gameCutIndex.textContent = cutNumber;
      gamePlayCut.textContent = cutNumber;
      gameCurrentTitle.textContent = title;
      gameCurrentDuration.textContent = cut.dataset.duration || "";
      gamePlayButton.setAttribute("aria-label", `播放王国纪元${title}`);
      gameVideo.setAttribute("aria-label", `播放王国纪元${title}`);
      gameBaseSource = source;

      const nextSource = getQualitySource(source);
      if (gameVideo.getAttribute("src") !== nextSource) {
        gameVideo.pause();
        gameVideo.src = nextSource;
        if (poster) {
          gameVideo.poster = poster;
        }
        gameVideo.load();
      }

      if (shouldPlay) {
        playGameVideo();
      }
    }

    gameCuts.forEach((cut) => {
      cut.addEventListener("click", () => {
        selectGameCut(cut);
      });
    });

    gamePlayButton.addEventListener("click", playGameVideo);

    bindQualitySelect(gameQuality, (quality) => {
      if (!gameBaseSource) return;
      loadVideoSource(
        gameVideo,
        getQualitySource(gameBaseSource, quality),
        { resume: true }
      );
    });

    gameVideo.addEventListener("play", () => {
      gamePlayer.classList.add("is-playing");
    });

    gameVideo.addEventListener("pause", () => {
      gamePlayer.classList.remove("is-playing");
    });

    gameVideo.addEventListener("ended", () => {
      gamePlayer.classList.remove("is-playing");
    });
  }

  const productAdCards = Array.from(document.querySelectorAll(".product-ad-card"));
  const productAdSeriesTabs = Array.from(document.querySelectorAll(".product-ad-series-tab"));
  const productAdGroups = Array.from(document.querySelectorAll("[data-series-group]"));
  const productAdPlayer = document.querySelector(".product-ads-player");
  const productAdMainVideo = document.getElementById("product-ad-main-video");
  const productAdQuality = document.getElementById("product-ad-quality");
  const productAdPlayButton = document.getElementById("product-ad-play-button");
  const productAdCutIndex = document.getElementById("product-ad-cut-index");
  const productAdPlayCut = document.getElementById("product-ad-play-cut");
  const productAdCurrentTitle = document.getElementById("product-ad-current-title");
  const productAdCurrentDuration = document.getElementById("product-ad-current-duration");

  if (
    productAdCards.length &&
    productAdSeriesTabs.length &&
    productAdGroups.length &&
    productAdPlayer &&
    productAdMainVideo &&
    productAdPlayButton &&
    productAdCutIndex &&
    productAdPlayCut &&
    productAdCurrentTitle &&
    productAdCurrentDuration
  ) {
    let productAdBaseSource =
      productAdMainVideo.dataset.baseSrc ||
      productAdMainVideo.getAttribute("src") ||
      "";

    if (productAdBaseSource) {
      const initialSource = getQualitySource(productAdBaseSource);
      if (productAdMainVideo.getAttribute("src") !== initialSource) {
        productAdMainVideo.src = initialSource;
        productAdMainVideo.load();
      }
    }

    function playProductAd() {
      const playAttempt = productAdMainVideo.play();
      if (playAttempt && typeof playAttempt.catch === "function") {
        playAttempt.catch(() => {
          // Keep the play overlay available if autoplay is blocked.
        });
      }
    }

    function setProductAdSeriesState(seriesId) {
      productAdSeriesTabs.forEach((tab) => {
        const active = tab.dataset.seriesTarget === seriesId;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-pressed", String(active));
      });

      productAdGroups.forEach((group) => {
        group.hidden = group.dataset.seriesGroup !== seriesId;
      });
    }

    function selectProductAdCard(card, shouldPlay = true) {
      const source = card.dataset.video;
      const poster = card.dataset.poster;
      const series = card.dataset.series || "";
      const index = card.dataset.index || "01";
      const duration = card.dataset.duration || "";
      const group = card.closest("[data-series-group]");
      const seriesId = group?.dataset.seriesGroup;

      if (!source) {
        return;
      }

      if (seriesId) {
        setProductAdSeriesState(seriesId);
      }

      productAdCards.forEach((item) => {
        const active = item === card;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });

      if (gameVideo) {
        gameVideo.pause();
      }

      const shortSeries = series.replace(/\sApp$/, "");
      productAdCutIndex.textContent = index;
      productAdPlayCut.textContent = index;
      productAdCurrentTitle.textContent = `${shortSeries} ${index}`;
      productAdCurrentDuration.textContent = duration;
      productAdPlayButton.setAttribute("aria-label", `播放${shortSeries}广告 ${index}`);
      productAdMainVideo.setAttribute("aria-label", `播放${shortSeries}广告 ${index}`);
      productAdBaseSource = source;

      const nextSource = getQualitySource(source);
      if (productAdMainVideo.getAttribute("src") !== nextSource) {
        productAdMainVideo.pause();
        productAdMainVideo.src = nextSource;
        if (poster) {
          productAdMainVideo.poster = poster;
        }
        productAdMainVideo.load();
      }

      if (shouldPlay) {
        playProductAd();
      }
    }

    function selectProductAdSeries(seriesId, shouldPlay = true) {
      const group = productAdGroups.find((item) => item.dataset.seriesGroup === seriesId);
      const firstCard = group?.querySelector(".product-ad-card");

      if (!firstCard) {
        return;
      }

      setProductAdSeriesState(seriesId);
      selectProductAdCard(firstCard, shouldPlay);
    }

    productAdSeriesTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        selectProductAdSeries(tab.dataset.seriesTarget, true);
      });
    });

    productAdCards.forEach((card) => {
      card.addEventListener("click", () => {
        selectProductAdCard(card, true);
      });
    });

    productAdPlayButton.addEventListener("click", playProductAd);

    bindQualitySelect(productAdQuality, (quality) => {
      if (!productAdBaseSource) return;
      loadVideoSource(
        productAdMainVideo,
        getQualitySource(productAdBaseSource, quality),
        { resume: true }
      );
    });

    productAdMainVideo.addEventListener("play", () => {
      productAdPlayer.classList.add("is-playing");
    });

    productAdMainVideo.addEventListener("pause", () => {
      productAdPlayer.classList.remove("is-playing");
    });

    productAdMainVideo.addEventListener("ended", () => {
      productAdPlayer.classList.remove("is-playing");
    });
  }

  const imageWorks = Array.from(document.querySelectorAll(".image-work"));
  const imageLightbox = document.getElementById("image-lightbox");
  const imageLightboxImage = document.getElementById("image-lightbox-image");
  const imageLightboxCaption = document.getElementById("image-lightbox-caption");
  const imageLightboxMeta = document.getElementById("image-lightbox-meta");
  const imageLightboxLink = document.getElementById("image-lightbox-link");
  const imageLightboxClose = document.querySelector(".image-lightbox__close");
  let lastImageWork = null;

  if (
    imageWorks.length &&
    imageLightbox &&
    imageLightboxImage &&
    imageLightboxCaption &&
    imageLightboxMeta &&
    imageLightboxLink &&
    imageLightboxClose
  ) {
    function openImageLightbox(card) {
      const full = card.dataset.full;
      const title = card.dataset.title || "";
      const category = card.dataset.category || "";

      if (!full) {
        return;
      }

      lastImageWork = card;
      imageLightboxImage.src = full;
      imageLightboxImage.alt = `${title}，${category}作品大图`;
      imageLightboxCaption.textContent = title;
      imageLightboxMeta.textContent = category;
      imageLightboxLink.href = full;
      document.body.classList.add("image-lightbox-open");

      if (typeof imageLightbox.showModal === "function") {
        imageLightbox.showModal();
      } else {
        imageLightbox.setAttribute("open", "");
      }

      imageLightboxClose.focus({ preventScroll: true });
    }

    imageWorks.forEach((card) => {
      card.addEventListener("click", () => {
        openImageLightbox(card);
      });
    });

    imageLightboxClose.addEventListener("click", () => {
      imageLightbox.close();
    });

    imageLightbox.addEventListener("click", (event) => {
      if (event.target === imageLightbox) {
        imageLightbox.close();
      }
    });

    imageLightbox.addEventListener("close", () => {
      document.body.classList.remove("image-lightbox-open");
      imageLightboxImage.removeAttribute("src");
      imageLightboxImage.removeAttribute("alt");

      if (lastImageWork) {
        lastImageWork.focus({ preventScroll: true });
        lastImageWork = null;
      }
    });
  }
})();
