fetch("repos.json")
  .then((res) => res.json())
  .then((data) => {
    const firstCount = 3; // number of cards for the first row
    let output1 = "";
    let output2 = "";
    data.forEach(function (repo, idx) {
      const card = `<!--repo card started-->
      <div class="col-md-4 col-sm-4 col-xs-12 mb-30">
        <div class="mdl-card mdl-shadow--2dp text-center pa-20 repo-card">
          <div class="mdl-card__title pa-0">
            <img class="img-responsive" loading="lazy" src="${repo.banner}" alt="${repo.name} banner">
          </div>
          <div class="mdl-card__supporting-text relative">
            <span class="blog-cat" style="${repo.lang ? "" : "display: none"};">
              <span class="lang" style="background-color: ${repo.color};"></span>
              <span>${repo.lang}</span>
            </span>
            <a href="${repo.url}"><h4 class="mt-15 mb-20">${repo.name}</h4></a>
            <p>${repo.description}</p>
            <a href="${repo.url}" class="mdl-button mdl-js-button mdl-button--raised bg-blue font-white" role="button">View</a>
          </div>
          <div class="mdl-card__actions mdl-card--border">
            <span class="blog-post-date inline-block">${repo.date.split("T")[0]}</span>
          </div>
        </div>
      </div>
      <!--repo card ended-->`;
      if (idx < firstCount) output1 += card; else output2 += card;
    });
    // render first row
    const target1 = document.getElementById("repo-card");
    if (target1) target1.innerHTML = output1;
    // render second row
    const target2 = document.getElementById("repo-card-2");
    if (target2) target2.innerHTML = output2;
  });
