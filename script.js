// サンプルデータ
let songs = JSON.parse(localStorage.getItem('songs')) || {
    jpop: [
        { title: '粛聖!! ロリ神レクイエム☆ / しぐれうい（9さい）', artist: 'しぐれうい', key: '原調', youtubeLink: 'https://www.youtube.com/watch?v=Ci_zad39Uhw' }
    ],
    anison: [],
    vocaloid: []
};

// お気に入りリスト
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// カスタムカテゴリリスト
let customCategories = JSON.parse(localStorage.getItem('customCategories')) || [];

// モーダル要素
const songModal = new bootstrap.Modal(document.getElementById('songModal'));
const youtubeSearchModal = new bootstrap.Modal(document.getElementById('youtubeSearchModal'));
const modalTitle = document.getElementById('modalTitle');
const songForm = document.getElementById('songForm');
const editIndex = document.getElementById('editIndex');
const categorySelect = document.getElementById('categorySelect');
const titleInput = document.getElementById('titleInput');
const artistInput = document.getElementById('artistInput');
const keySelect = document.getElementById('keySelect');
const youtubeLinkInput = document.getElementById('youtubeLinkInput');
const youtubeSearchResults = document.getElementById('youtubeSearchResults');

// YouTubeの動画IDを取得する関数
function getYouTubeVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// YouTubeの動画を再生する関数
async function playYouTubeVideo(url, title, artist) {
    const videoId = getYouTubeVideoId(url);
    if (!videoId) {
        alert('無効なYouTube URLです。');
        return;
    }

    // 直接YouTubeで開く
    window.open(url, '_blank');
}

// 曲リストを表示する関数
function displaySongs(category, searchQuery = '') {
    const songList = document.getElementById(`${category}List`);
    songList.innerHTML = ''; // リストをクリア

    let songsToDisplay;
    if (category === 'favorites') {
        songsToDisplay = favorites;
    } else if (category === 'all') {
        // すべてのカテゴリの曲を結合
        songsToDisplay = Object.values(songs).flat();
    } else {
        songsToDisplay = songs[category] || [];
    }

    // 検索フィルター適用
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        songsToDisplay = songsToDisplay.filter(song => 
            song.title.toLowerCase().includes(query) || 
            song.artist.toLowerCase().includes(query)
        );

        // 検索結果が0件の場合、YouTube検索を実行
        if (songsToDisplay.length === 0) {
            searchYouTube(searchQuery);
            return;
        }
    }

    songsToDisplay.forEach((song, index) => {
        const songElement = document.createElement('div');
        songElement.className = 'song-item';
        const isFavorite = favorites.some(fav => 
            fav.title === song.title && fav.artist === song.artist
        );
        
        // カテゴリラベルを追加
        const categoryLabel = category === 'all' ? 
            `<span class="category-label">${getCategoryLabel(song)}</span>` : '';
        
        // カテゴリを取得
        const songCategory = category === 'all' ? getSongCategory(song) : category;
        
        songElement.innerHTML = `
            <div class="song-title">${song.title}</div>
            <div class="song-artist">${song.artist}</div>
            <div class="song-key">${song.key}</div>
            ${categoryLabel}
            ${song.youtubeLink ? `
                <a href="#" class="youtube-link" onclick="playYouTubeVideo('${song.youtubeLink}', '${song.title}', '${song.artist}'); return false;">
                    <i class="bi bi-youtube"></i> YouTubeで聴く
                </a>
            ` : ''}
            <div class="song-actions">
                <button class="favorite-btn ${isFavorite ? 'active' : ''}" onclick="toggleFavorite('${song.title}', '${song.artist}')">
                    <i class="bi bi-heart${isFavorite ? '-fill' : ''}"></i>
                </button>
                <button onclick="editSong('${songCategory}', ${index})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button onclick="deleteSong('${songCategory}', ${index})">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        songList.appendChild(songElement);
    });
}

// カテゴリリストを保存する関数
function saveCategoriesToStorage() {
    localStorage.setItem('customCategories', JSON.stringify(customCategories));
}

// カテゴリの表示名を取得する関数
function getCategoryDisplayName(category) {
    switch (category) {
        case 'jpop': return 'J-POP';
        case 'anison': return 'アニソン';
        case 'vocaloid': return 'ボカロ';
        default: 
            // カスタムカテゴリの場合は対応する表示名を返す
            const customCategory = customCategories.find(cat => cat.id === category);
            return customCategory ? customCategory.name : category;
    }
}

// カテゴリラベルを取得する関数
function getCategoryLabel(song) {
    for (const [category, songList] of Object.entries(songs)) {
        if (songList.some(s => s.title === song.title && s.artist === song.artist)) {
            return getCategoryDisplayName(category);
        }
    }
    return '';
}

// 曲のカテゴリを取得する関数
function getSongCategory(song) {
    for (const [category, songList] of Object.entries(songs)) {
        if (songList.some(s => s.title === song.title && s.artist === song.artist)) {
            return category;
        }
    }
    return 'jpop'; // デフォルトはJ-POP
}

// 曲を追加する関数
function addSong() {
    modalTitle.textContent = '曲を追加';
    songForm.reset();
    editIndex.value = '';
    songModal.show();
}

// 曲を編集する関数
function editSong(category, index) {
    const song = songs[category][index];
    if (song) {
        // モーダルのタイトルを変更
        document.getElementById('modalTitle').textContent = '曲を編集';
        
        // フォームに値を設定
        document.getElementById('editIndex').value = `${category},${index}`;
        document.getElementById('categorySelect').value = category;
        document.getElementById('titleInput').value = song.title;
        document.getElementById('artistInput').value = song.artist;
        document.getElementById('keySelect').value = song.key;
        document.getElementById('youtubeLinkInput').value = song.youtubeLink || '';
        
        // モーダルを表示
        songModal.show();
    }
}

// 曲を削除する関数
function deleteSong(category, index) {
    if (confirm('この曲を削除してもよろしいですか？')) {
        songs[category].splice(index, 1);
        // ローカルストレージに保存
        saveSongsToStorage();
        
        // 全てのタブの曲リストを更新
        displaySongs('all');
        displaySongs('jpop');
        displaySongs('anison');
        displaySongs('vocaloid');
        customCategories.forEach(category => {
            displaySongs(category.id);
        });
        displaySongs('favorites');
    }
}

// お気に入りを切り替える関数
function toggleFavorite(title, artist) {
    const index = favorites.findIndex(fav => 
        fav.title === title && fav.artist === artist
    );

    if (index === -1) {
        // お気に入りに追加
        const song = Object.values(songs).flat().find(s => 
            s.title === title && s.artist === artist
        );
        favorites.push(song);
    } else {
        // お気に入りから削除
        favorites.splice(index, 1);
    }

    // ローカルストレージに保存
    localStorage.setItem('favorites', JSON.stringify(favorites));

    // 表示を更新
    const currentTab = document.querySelector('.nav-link.active').getAttribute('data-bs-target').substring(1);
    displaySongs(currentTab);
    displaySongs('favorites');
}

// 曲を保存する関数
function saveSongsToStorage() {
    localStorage.setItem('songs', JSON.stringify(songs));
}

// 曲を保存する関数
async function saveSong() {
    const editIndex = document.getElementById('editIndex').value;
    const category = document.getElementById('categorySelect').value;
    const title = document.getElementById('titleInput').value;
    const artist = document.getElementById('artistInput').value;
    const key = document.getElementById('keySelect').value;
    const youtubeLink = document.getElementById('youtubeLinkInput').value;

    if (!title) {
        alert('曲名は必須です。');
        return;
    }

    // YouTubeリンクが入力されている場合、動画IDの形式チェックのみ行う
    if (youtubeLink) {
        const videoId = getYouTubeVideoId(youtubeLink);
        if (!videoId) {
            alert('無効なYouTube URLです。');
            return;
        }
    }

    const song = {
        title,
        artist,
        key,
        youtubeLink
    };

    if (editIndex !== '') {
        // 編集モード
        const [oldCategory, index] = editIndex.split(',');
        
        // カテゴリが変更された場合、元のカテゴリから曲を削除
        if (oldCategory !== category) {
            songs[oldCategory].splice(index, 1);
        } else {
            songs[oldCategory][index] = song;
        }
        
        // 新しいカテゴリに曲を追加
        if (!songs[category]) {
            songs[category] = [];
        }
        songs[category].push(song);
    } else {
        // 新規追加モード
        if (!songs[category]) {
            songs[category] = [];
        }
        songs[category].push(song);
    }

    // ローカルストレージに保存
    saveSongsToStorage();

    // 曲リストを更新
    displaySongs('all');
    displaySongs('jpop');
    displaySongs('anison');
    displaySongs('vocaloid');
    customCategories.forEach(category => {
        displaySongs(category.id);
    });
    displaySongs('favorites');

    // モーダルを閉じる
    songModal.hide();

    // フォームをリセット
    document.getElementById('songForm').reset();
    document.getElementById('editIndex').value = '';
}

// 検索機能
function searchSongs() {
    const searchQuery = document.getElementById('searchInput').value.trim();
    const currentTab = document.querySelector('.nav-link.active').getAttribute('data-bs-target').substring(1);
    displaySongs(currentTab, searchQuery);
}

// 検索の遅延実行用の変数
let searchTimeout;

// YouTube検索を実行する関数
async function searchYouTube(query) {
    try {
        // YouTubeの検索URLを構築
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        
        // 検索結果を表示
        displayYouTubeResults(searchUrl, query);
    } catch (error) {
        console.error('YouTube検索エラー:', error);
        alert('YouTube検索中にエラーが発生しました。');
    }
}

// YouTube検索結果を表示する関数
function displayYouTubeResults(searchUrl, query) {
    youtubeSearchResults.innerHTML = `
        <div class="text-center mb-3">
            <h5>曲が見つかりませんでした</h5>
            <p>YouTubeで「${decodeURIComponent(query)}」を検索します</p>
            <a href="${searchUrl}" target="_blank" class="btn btn-primary mb-3">
                <i class="bi bi-youtube"></i> YouTubeで検索
            </a>
        </div>
        <div class="alert alert-info">
            <i class="bi bi-info-circle"></i> 検索結果から動画を選択し、URLをコピーして「曲を追加」ボタンから追加してください。
        </div>
        <div class="text-center">
            <button class="btn btn-success" onclick="addSongFromYouTube('${query}', '')">
                <i class="bi bi-plus-circle"></i> 曲を追加
            </button>
        </div>
    `;

    youtubeSearchModal.show();
}

// YouTubeの動画から曲を追加する関数
function addSongFromYouTube(query = '', searchUrl = '') {
    modalTitle.textContent = '曲を追加';
    categorySelect.value = 'jpop'; // デフォルトでJ-POPに設定
    titleInput.value = query; // 検索クエリを曲名として設定
    artistInput.value = '';
    keySelect.value = '原調';
    youtubeLinkInput.value = searchUrl; // YouTubeリンクを自動設定
    editIndex.value = '';
    
    youtubeSearchModal.hide();
    songModal.show();
}

// カスタムカテゴリのタブを作成する関数
function createCategoryTab(category) {
    const tabsContainer = document.getElementById('songTabs');
    const contentContainer = document.getElementById('songTabsContent');

    // タブアイテムの作成
    const tabItem = document.createElement('li');
    tabItem.className = 'nav-item';
    tabItem.setAttribute('role', 'presentation');
    tabItem.setAttribute('data-category-id', category.id);
    
    // タブボタンの作成
    const tabButton = document.createElement('button');
    tabButton.className = 'nav-link';
    tabButton.id = `${category.id}-tab`;
    tabButton.setAttribute('data-bs-toggle', 'tab');
    tabButton.setAttribute('data-bs-target', `#${category.id}`);
    tabButton.setAttribute('type', 'button');
    tabButton.setAttribute('role', 'tab');
    tabButton.textContent = category.name;
    
    // タブコンテンツの作成
    const tabContent = document.createElement('div');
    tabContent.className = 'tab-pane fade';
    tabContent.id = category.id;
    tabContent.setAttribute('role', 'tabpanel');
    
    // 曲リスト用のコンテナの作成
    const songListContainer = document.createElement('div');
    songListContainer.className = 'song-list';
    songListContainer.id = `${category.id}List`;
    
    // 要素の追加
    tabItem.appendChild(tabButton);
    tabContent.appendChild(songListContainer);
    
    // お気に入りタブの前に新しいタブを挿入
    const favoritesTab = document.getElementById('favorites-tab').parentElement;
    tabsContainer.insertBefore(tabItem, favoritesTab);
    
    // タブコンテンツの追加
    contentContainer.appendChild(tabContent);
}

// カスタムカテゴリのセレクトオプションを追加する関数
function addCategoryToSelect(category) {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name;
    categorySelect.appendChild(option);
}

// 新しいカテゴリを追加する関数
function addNewCategory(categoryName) {
    if (!categoryName.trim()) {
        alert('カテゴリ名を入力してください。');
        return false;
    }
    
    // カテゴリIDを生成（スペースをハイフンに変換し、小文字に）
    const categoryId = `category-${Date.now()}`;
    
    // 新しいカテゴリオブジェクトを作成
    const newCategory = {
        id: categoryId,
        name: categoryName
    };
    
    // カスタムカテゴリリストに追加
    customCategories.push(newCategory);
    
    // songs オブジェクトに新しいカテゴリの配列を追加
    songs[categoryId] = [];
    
    // カテゴリをセレクトボックスに追加
    addCategoryToSelect(newCategory);
    
    // カテゴリのタブを作成
    createCategoryTab(newCategory);
    
    // カテゴリリストを保存
    saveCategoriesToStorage();
    saveSongsToStorage();
    
    // 新しく追加したカテゴリを選択
    categorySelect.value = categoryId;
    
    return true;
}

// すべてのカスタムカテゴリのタブとセレクトオプションを作成
function initializeCustomCategories() {
    // 既存のカスタムカテゴリタブをクリア
    document.querySelectorAll('#songTabs [data-category-id]').forEach(tab => {
        tab.remove();
    });
    
    // セレクトボックスのカスタムカテゴリオプションをクリア
    document.querySelectorAll('#categorySelect option:not([value="jpop"]):not([value="anison"]):not([value="vocaloid"])').forEach(option => {
        option.remove();
    });
    
    // カスタムカテゴリのタブとセレクトオプションを追加
    customCategories.forEach(category => {
        createCategoryTab(category);
        addCategoryToSelect(category);
        
        // songs オブジェクトにカテゴリがなければ追加
        if (!songs[category.id]) {
            songs[category.id] = [];
        }
    });
}

// イベントリスナーの設定
document.addEventListener('DOMContentLoaded', () => {
    // カスタムカテゴリの初期化
    initializeCustomCategories();
    
    // 各カテゴリの曲リストを表示
    displaySongs('all');
    displaySongs('jpop');
    displaySongs('anison');
    displaySongs('vocaloid');
    customCategories.forEach(category => {
        displaySongs(category.id);
    });
    displaySongs('favorites');

    // 曲追加ボタンのイベントリスナー
    document.getElementById('addSongButton').addEventListener('click', addSong);

    // 保存ボタンのイベントリスナー
    document.getElementById('saveSongButton').addEventListener('click', saveSong);

    // 検索ボタンのイベントリスナー
    document.getElementById('searchButton').addEventListener('click', searchSongs);

    // 検索入力フィールドのEnterキーイベントリスナー
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchSongs();
        }
    });
    
    // 新しいカテゴリ追加ボタンのイベントリスナー
    document.getElementById('addCategoryButton').addEventListener('click', () => {
        document.getElementById('newCategoryForm').style.display = 'block';
        document.getElementById('addCategoryButton').style.display = 'none';
        document.getElementById('newCategoryInput').focus();
    });
    
    // 新しいカテゴリ保存ボタンのイベントリスナー
    document.getElementById('saveNewCategoryButton').addEventListener('click', () => {
        const categoryName = document.getElementById('newCategoryInput').value.trim();
        if (addNewCategory(categoryName)) {
            document.getElementById('newCategoryForm').style.display = 'none';
            document.getElementById('addCategoryButton').style.display = 'block';
            document.getElementById('newCategoryInput').value = '';
        }
    });
    
    // 新しいカテゴリキャンセルボタンのイベントリスナー
    document.getElementById('cancelNewCategoryButton').addEventListener('click', () => {
        document.getElementById('newCategoryForm').style.display = 'none';
        document.getElementById('addCategoryButton').style.display = 'block';
        document.getElementById('newCategoryInput').value = '';
    });
    
    // 新しいカテゴリ入力フィールドのEnterキーイベントリスナー
    document.getElementById('newCategoryInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const categoryName = document.getElementById('newCategoryInput').value.trim();
            if (addNewCategory(categoryName)) {
                document.getElementById('newCategoryForm').style.display = 'none';
                document.getElementById('addCategoryButton').style.display = 'block';
                document.getElementById('newCategoryInput').value = '';
            }
        }
    });
}); 