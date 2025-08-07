// Dark mode functionality
function initDarkMode() {
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const body = document.body;
  const sunIcon = document.querySelector('.sun-icon');
  const moonIcon = document.querySelector('.moon-icon');
  
  // Check for saved theme preference or default to light mode
  const savedTheme = getCookie('theme') || 'light';
  if (savedTheme === 'dark') {
    applyDarkMode(true);
  }
  
  darkModeToggle.addEventListener('click', () => {
    const isDark = body.classList.contains('dark');
    applyDarkMode(!isDark);
    setCookie('theme', !isDark ? 'dark' : 'light', 365);
  });
  
  function applyDarkMode(isDark) {
    if (isDark) {
      body.classList.add('dark');
      sunIcon.style.display = 'flex';
      moonIcon.style.display = 'none';
    } else {
      body.classList.remove('dark');
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'flex';
    }
  }
}

// Cookie functions
function setCookie(name, value, days) {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = name + '=' + value + ';expires=' + expires.toUTCString() + ';path=/';
}

function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

$(function () {
  // Initialize dark mode
  initDarkMode();
  
  // Enhanced keyword cleaning with multilingual support
  function cleanKeyword(keyword) {
    return keyword.replace(/[^\w\s\u0900-\u097F\u0600-\u06FF\u4E00-\u9FFF]/g, '').trim().toLowerCase();
  }
  
  // Enhanced keyword suggestions with multilingual support
  function generateKeywordSuggestions() {
    const title = $('#title-input').val();
    const description = $('#description-input').val();
    const combinedText = title + ' ' + description;
    
    if (combinedText.trim().length < 10) {
      return;
    }
    
    let suggestions = [];
    
    try {
      // Use Compromise.js for English text
      if (window.nlp) {
        const doc = window.nlp(combinedText);
        const nouns = doc.nouns().out('array');
        const adjectives = doc.adjectives().out('array');
        const verbs = doc.verbs().out('array');
        
        suggestions = [...new Set([...nouns, ...adjectives, ...verbs])];
      }
    } catch (error) {
      console.log('Compromise.js processing failed, using fallback');
    }
    
    // Fallback: Extract words using simple regex for multilingual support
    const words = combinedText.match(/[\w\u0900-\u097F\u0600-\u06FF\u4E00-\u9FFF]+/g) || [];
    const fallbackSuggestions = words
      .filter(word => word.length > 2 && word.length < 20)
      .slice(0, 15);
    
    // Combine both approaches
    suggestions = [...new Set([...suggestions, ...fallbackSuggestions])]
      .map(word => cleanKeyword(word))
      .filter(word => word.length > 2 && word.length < 20 && word !== '')
      .slice(0, 8);
    
    displayKeywordSuggestions(suggestions);
  }
  
  function displayKeywordSuggestions(suggestions) {
    // Remove existing suggestions
    $('#keywords-container .suggested-keyword').remove();
    
    if (suggestions.length === 0) return;
    
    suggestions.forEach(function(keyword) {
      // Check if keyword already exists
      const existingKeywords = $("#keywords-container .keyword-tag span")
        .map(function () { return $(this).text().toLowerCase(); })
        .get();
      
      if (existingKeywords.includes(keyword.toLowerCase())) {
        return;
      }
      
      const suggestion = $('<div>', {
        class: 'suggested-keyword flex items-center rounded-lg px-3 py-2 cursor-pointer transition-all duration-200 text-sm',
        click: function() {
          addKeyword(keyword, false);
          $(this).remove();
        },
        role: 'button',
        tabindex: 0,
        'aria-label': `Add suggested keyword: ${keyword}`
      });
      
      suggestion.html(`<i class="fas fa-plus-circle mr-2" aria-hidden="true"></i>${keyword}`);
      
      // Add keyboard support for suggestions
      suggestion.on('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          $(this).click();
        }
      });
      
      $('#keywords-container').append(suggestion);
    });
  }
  
  // Debounced keyword suggestion generation
  let suggestionTimeout;
  function debouncedSuggestions() {
    clearTimeout(suggestionTimeout);
    suggestionTimeout = setTimeout(generateKeywordSuggestions, 500);
  }
  
  $('#title-input, #description-input').on('input', debouncedSuggestions);

  // Enhanced function to add keywords as labels
  function addKeyword(keyword, isSuggestion = false) {
    keyword = cleanKeyword(keyword);
    if (keyword === '') return;
    
    // Check if keyword already exists
    const existingKeywords = $("#keywords-container .keyword-tag span")
      .map(function () { return $(this).text().toLowerCase(); })
      .get();
    
    if (existingKeywords.includes(keyword.toLowerCase())) {
      return;
    }
    
    var keywordLabel = $("<div>", {
      class: "keyword-tag flex items-center rounded-lg px-3 py-2 transition-all duration-200",
    });
    
    var keywordText = $("<span>", {
      text: keyword,
      class: "mr-2 text-white text-sm font-medium",
    });
    
    var deleteButton = $("<button>", {
      type: "button",
      class: "text-white hover:text-red-200 transition-colors focus:outline-none focus:ring-1 focus:ring-white rounded",
      html: '<i class="fas fa-times" aria-hidden="true"></i>',
      'aria-label': `Remove keyword: ${keyword}`,
      click: function () {
        $(this).parent().fadeOut(200, function() {
          $(this).remove();
          // Announce removal for screen readers
          announceToScreenReader(`Keyword ${keyword} removed`);
        });
      },
    });
    
    keywordLabel.append(keywordText, deleteButton);
    
    // Add with animation
    keywordLabel.hide().appendTo("#keywords-container").fadeIn(200);
    
    // Announce addition for screen readers
    announceToScreenReader(`Keyword ${keyword} added`);
  }

  // Screen reader announcements
  function announceToScreenReader(message) {
    const announcement = $('<div>', {
      'aria-live': 'polite',
      'aria-atomic': 'true',
      class: 'sr-only',
      text: message
    });
    
    $('body').append(announcement);
    setTimeout(() => announcement.remove(), 1000);
  }

  // Event handler for keyword input
  $("#keyword-input").keydown(function (e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      var keywords = $(this).val().trim();
      if (keywords === "") return;
      
      var keywordArray = keywords.split(",");
      keywordArray.forEach(function (keyword) {
        keyword = keyword.trim();
        if (keyword !== "") {
          addKeyword(keyword);
        }
      });
      $(this).val("");
      
      // Regenerate suggestions
      debouncedSuggestions();
    }
  });

  // Clear button click event
  $("#clear-button").click(function (e) {
    e.preventDefault();
    const keywordCount = $("#keywords-container .keyword-tag").length;
    
    $("#keywords-container").children().fadeOut(200, function() {
      $(this).remove();
      generateKeywordSuggestions();
      
      if (keywordCount > 0) {
        announceToScreenReader(`All ${keywordCount} keywords cleared`);
      }
    });
  });

  // Animation timeout variables
  var generateAnimationTimeout;
  var copyAnimationTimeout;

  $("#meta-form").submit(function (e) {
    e.preventDefault();

    // Animation for Generate button
    clearTimeout(generateAnimationTimeout);
    const $generateBtn = $("#generate-button");
    const originalText = $generateBtn.html();
    $generateBtn.html('<i class="fas fa-spinner fa-spin mr-2" aria-hidden="true"></i>Generating...');
    $generateBtn.prop('disabled', true);
    
    setTimeout(() => {
      var title = $("#meta-form input[name='title']").val();
      var description = $("#meta-form textarea[name='description']").val();
      var keywords = $("#keywords-container .keyword-tag span")
        .map(function () {
          return $(this).text();
        })
        .get()
        .join(", ");
      var image = $("#meta-form input[name='image']").val();
      var revisit = $("#meta-form input[name='revisit']").val();

      var metaTag = `<meta name="title" content="${title}">
<meta name="description" content="${description}">
<meta name="keywords" content="${keywords}">
<meta name="image" content="${image}">

<!-- Open Graph general (Facebook, Pinterest) -->
<meta name="og:title" content="${title}">
<meta name="og:description" content="${description}">
<meta name="og:image" content="${image}">
<meta name="og:image:alt" content="${title}">
<meta name="og:site_name" content="${title}">

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image:src" content="${image}">

<!-- Search Engine -->
<meta name="description" content="${description}">
<meta name="image" content="${image}">

<!-- Schema.org for Google -->
<meta itemprop="name" content="${title}">
<meta itemprop="description" content="${description}">
<meta itemprop="image" content="${image}">

<meta name="revisit-after" content="${revisit} days">`;
      
      $("#meta-tag").val(metaTag).removeClass('opacity-50');
      $generateBtn.html('<i class="fas fa-check mr-2" aria-hidden="true"></i>Generated!');
      $generateBtn.prop('disabled', false);
      
      // Announce completion for screen readers
      announceToScreenReader('Meta tags generated successfully');
      
      // Focus the output textarea for screen reader users
      $("#meta-tag").focus();
      
      setTimeout(() => {
        $generateBtn.html(originalText);
      }, 1500);
    }, 1000);
  });

  $("#copy-button").click(function () {
    var copyText = document.getElementById("meta-tag");
    
    if (copyText.value.trim() === '') {
      announceToScreenReader('No meta tags to copy. Please generate meta tags first.');
      return;
    }
    
    navigator.clipboard.writeText(copyText.value).then(() => {
      var $copyButton = $(this);
      const originalText = $copyButton.html();
      
      $copyButton.html('<i class="fas fa-check mr-2" aria-hidden="true"></i>Copied!');
      $copyButton.prop('disabled', true);
      
      // Announce success for screen readers
      announceToScreenReader('Meta tags copied to clipboard');

      setTimeout(function () {
        $copyButton.html(originalText);
        $copyButton.prop('disabled', false);
      }, 1500);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      announceToScreenReader('Failed to copy meta tags. Please try again.');
    });
  });

  // Enhanced clear button interactions
  $("#clear-button").mousedown(function () {
    $(this).addClass("transform scale-95");
  });

  $("#clear-button").mouseup(function () {
    $(this).removeClass("transform scale-95");
  });

  $("#clear-button").mouseleave(function () {
    $(this).removeClass("transform scale-95");
  });
  
  // Keyboard navigation for suggested keywords
  $(document).on('keydown', '.suggested-keyword', function(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      $(this).next('.suggested-keyword').focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      $(this).prev('.suggested-keyword').focus();
    }
  });
  
  // Form validation feedback
  $('input[required], textarea[required]').on('blur', function() {
    const $field = $(this);
    const $label = $(`label[for="${this.id}"]`);
    
    if (!this.checkValidity()) {
      $field.addClass('border-red-500 focus:border-red-500 focus:ring-red-200');
      $label.addClass('text-red-600');
    } else {
      $field.removeClass('border-red-500 focus:border-red-500 focus:ring-red-200');
      $label.removeClass('text-red-600');
    }
  });
  
  // Character count for description
  $('#description-input').on('input', function() {
    const length = $(this).val().length;
    const $help = $('#description-help');
    
    if (length > 160) {
      $help.text(`Current length: ${length} characters (${length - 160} over recommended)`).addClass('text-orange-600');
    } else if (length >= 150) {
      $help.text(`Current length: ${length} characters (optimal length)`).removeClass('text-orange-600').addClass('text-green-600');
    } else {
      $help.text(`Current length: ${length} characters (optimal: 150-160 characters)`).removeClass('text-orange-600 text-green-600');
    }
  });
  
  // Title length feedback
  $('#title-input').on('input', function() {
    const length = $(this).val().length;
    const $help = $('#title-help');
    
    if (length > 60) {
      $help.text(`Current length: ${length} characters (may be truncated in search results)`).addClass('text-orange-600');
    } else {
      $help.text('This will be the main title shown in search results').removeClass('text-orange-600');
    }
  });
});

$(document).ready(function () {
  // Enhanced animations with reduced motion support
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (!prefersReducedMotion) {
    // Only animate if user hasn't requested reduced motion
    gsap.from('header', {
      opacity: 0,
      y: -30,
      duration: 0.8,
      ease: "back.out(1.7)"
    });
    
    gsap.from('#meta-form', {
      opacity: 0,
      y: 50,
      duration: 1,
      delay: 0.3,
      ease: "back.out(1.7)"
    });
    
    gsap.from('#meta-form > div', {
      opacity: 0,
      x: -20,
      duration: 0.6,
      delay: 0.6,
      stagger: 0.1,
      ease: "power2.out"
    });
    
    gsap.from('#meta-form + div', {
      opacity: 0,
      y: 30,
      duration: 0.8,
      delay: 1,
      ease: "back.out(1.7)"
    });
    
    gsap.from('footer', {
      opacity: 0,
      duration: 0.6,
      delay: 1.2
    });
  } else {
    // Immediate show for reduced motion preference
    gsap.set('header, #meta-form, #meta-form > div, #meta-form + div, footer', {
      opacity: 1,
      x: 0,
      y: 0
    });
  }
});