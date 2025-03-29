// 定数定義
const CATEGORY = {
    ALL: 'all',
    FAVORITES: 'favorites',
    JPOP: 'jpop',
    ANISON: 'anison',
    VOCALOID: 'vocaloid'
};

// ストレージ管理
const Storage = {
    saveSongs(data) {
        localStorage.setItem('songs', JSON.stringify(data));
    },
    loadSongs() {
        try {
            const savedData = localStorage.getItem('songs');
            if (!savedData) {
                return {
                    [CATEGORY.JPOP]: [],
                    [CATEGORY.ANISON]: [],
                    [CATEGORY.VOCALOID]: [
                        { title: '曲名サンプル', artist: 'アーティストサンプル', key: '原調', youtubeLink: 'https://youtu.be/RpLE5A-xFZM?si=_r6XRs-4pgeMVJXw' }
                    ]
                };
            }
            
            const parsedData = JSON.parse(savedData);
            
            // 必須カテゴリが存在しない場合は追加
            if (!parsedData[CATEGORY.JPOP]) parsedData[CATEGORY.JPOP] = [];
            if (!parsedData[CATEGORY.ANISON]) parsedData[CATEGORY.ANISON] = [];
            if (!parsedData[CATEGORY.VOCALOID]) parsedData[CATEGORY.VOCALOID] = [];
            
            // 各カテゴリが配列であることを確認
            Object.keys(parsedData).forEach(category => {
                if (!Array.isArray(parsedData[category])) {
                    console.warn(`カテゴリ ${category} が配列ではありません。空の配列で初期化します。`);
                    parsedData[category] = [];
                }
            });
            
            return parsedData;
        } catch (error) {
            console.error('曲データの読み込みエラー:', error);
            return {
                [CATEGORY.JPOP]: [],
                [CATEGORY.ANISON]: [],
                [CATEGORY.VOCALOID]: []
            };
        }
    },
    saveFavorites(data) {
        localStorage.setItem('favorites', JSON.stringify(data));
    },
    loadFavorites() {
        try {
            const savedData = localStorage.getItem('favorites');
            if (!savedData) return [];
            
            const parsedData = JSON.parse(savedData);
            if (!Array.isArray(parsedData)) {
                console.warn('お気に入りデータが配列ではありません。空の配列で初期化します。');
                return [];
            }
            
            // 無効なデータを除外
            return parsedData.filter(item => item && typeof item === 'object' && item.title);
        } catch (error) {
            console.error('お気に入りデータの読み込みエラー:', error);
            return [];
        }
    },
    saveCategories(data) {
        localStorage.setItem('customCategories', JSON.stringify(data));
    },
    loadCategories() {
        try {
            const savedData = localStorage.getItem('customCategories');
            if (!savedData) return [];
            
            const parsedData = JSON.parse(savedData);
            if (!Array.isArray(parsedData)) {
                console.warn('カスタムカテゴリデータが配列ではありません。空の配列で初期化します。');
                return [];
            }
            
            // 無効なカテゴリを除外
            return parsedData.filter(category => 
                category && 
                typeof category === 'object' && 
                category.id && 
                category.name
            );
        } catch (error) {
            console.error('カスタムカテゴリデータの読み込みエラー:', error);
            return [];
        }
    },
    // ストレージをリセットする関数
    resetStorage() {
        if (confirm('すべてのデータをリセットしてもよろしいですか？この操作は元に戻せません。')) {
            localStorage.removeItem('songs');
            localStorage.removeItem('favorites');
            localStorage.removeItem('customCategories');
            location.reload(); // ページをリロード
        }
    }
};

// データ初期化
let songs = Storage.loadSongs();
let favorites = Storage.loadFavorites();
let customCategories = Storage.loadCategories();

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

/**
 * YouTubeの動画IDを取得する関数
 * @param {string} url - YouTubeのURL
 * @returns {string|null} YouTubeの動画ID、無効なURLの場合はnull
 */
function getYouTubeVideoId(url) {
    if (!url) return null;
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * YouTubeの動画を再生する関数
 * @param {string} url - YouTubeのURL
 * @param {string} title - 曲のタイトル
 * @param {string} artist - アーティスト名
 * @returns {Promise<void>}
 */
async function playYouTubeVideo(url, title, artist) {
    try {
        const videoId = getYouTubeVideoId(url);
        if (!videoId) {
            alert('無効なYouTube URLです。');
            return;
        }

        // 直接YouTubeで開く
        window.open(url, '_blank');
    } catch (error) {
        console.error('YouTube再生エラー:', error);
        alert('動画の再生中にエラーが発生しました。');
    }
}

/**
 * 曲リストを表示する関数
 * @param {string} category - 表示するカテゴリ
 * @param {string} searchQuery - 検索クエリ（オプション）
 */
function displaySongs(category, searchQuery = '') {
    const songList = document.getElementById(`${category}List`);
    if (!songList) {
        console.error(`カテゴリ「${category}」の曲リスト要素が見つかりません。`);
        return;
    }
    
    songList.innerHTML = ''; // リストをクリア

    let songsToDisplay = [];
    
    try {
        if (category === CATEGORY.FAVORITES) {
            songsToDisplay = favorites;
        } else if (category === CATEGORY.ALL) {
            // すべてのカテゴリの曲を結合
            songsToDisplay = Object.values(songs).flat();
        } else if (songs[category]) {
            songsToDisplay = songs[category];
        } else {
            console.warn(`存在しないカテゴリ: ${category}`);
            return;
        }

        // 検索フィルター適用
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            songsToDisplay = songsToDisplay.filter(song => 
                (song && song.title && song.title.toLowerCase().includes(query)) || 
                (song && song.artist && song.artist.toLowerCase().includes(query))
            );

            // 検索結果が0件の場合、YouTube検索を実行
            if (songsToDisplay.length === 0) {
                searchYouTube(searchQuery);
                return;
            }
        }

        songsToDisplay.forEach((song, index) => {
            if (!song) return; // nullまたはundefinedの曲をスキップ
            
            const songElement = document.createElement('div');
            songElement.className = 'song-item';
            
            const isFavorite = favorites.some(fav => 
                fav && song && fav.title === song.title && fav.artist === song.artist
            );
            
            // カテゴリ情報の取得
            let songCategory = category;
            let categoryLabel = '';
            
            // 全曲表示の場合は、実際のカテゴリを取得
            if (category === CATEGORY.ALL) {
                songCategory = getSongCategory(song);
                if (songCategory) {
                    categoryLabel = `<span class="category-label">${getCategoryLabel(song)}</span>`;
                } else {
                    // カテゴリが見つからない場合はスキップ
                    console.warn('カテゴリが見つからない曲:', song);
                    return;
                }
            }
            
            // 曲タイトルとアーティスト名のエスケープ処理
            const safeTitle = escapeHtml(song.title || '');
            const safeArtist = escapeHtml(song.artist || '');
            const safeKey = escapeHtml(song.key || '');
            const safeYoutubeLink = song.youtubeLink ? escapeHtml(song.youtubeLink) : '';
            
            songElement.innerHTML = `
                <div class="song-title">${safeTitle}</div>
                <div class="song-artist">${safeArtist}</div>
                <div class="song-key">${safeKey}</div>
                ${categoryLabel}
                ${safeYoutubeLink ? `
                    <a href="#" class="youtube-link" data-url="${safeYoutubeLink}" data-title="${safeTitle}" data-artist="${safeArtist}">
                        <i class="bi bi-youtube"></i> YouTubeで聴く
                    </a>
                ` : ''}
                <div class="song-actions">
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-title="${safeTitle}" data-artist="${safeArtist}" data-tooltip="${isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}">
                        <i class="bi bi-heart${isFavorite ? '-fill' : ''}"></i>
                    </button>
                    <button class="edit-btn" data-category="${songCategory}" data-index="${index}" data-tooltip="編集">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="delete-btn" data-category="${songCategory}" data-index="${index}" data-tooltip="削除">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `;
            
            // イベントリスナーを追加
            const youtubeLink = songElement.querySelector('.youtube-link');
            if (youtubeLink) {
                youtubeLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    const url = e.currentTarget.getAttribute('data-url');
                    const title = e.currentTarget.getAttribute('data-title');
                    const artist = e.currentTarget.getAttribute('data-artist');
                    playYouTubeVideo(url, title, artist);
                });
            }
            
            const favoriteBtn = songElement.querySelector('.favorite-btn');
            favoriteBtn.addEventListener('click', () => {
                const title = favoriteBtn.getAttribute('data-title');
                const artist = favoriteBtn.getAttribute('data-artist');
                toggleFavorite(title, artist);
            });
            
            const editBtn = songElement.querySelector('.edit-btn');
            editBtn.addEventListener('click', () => {
                const category = editBtn.getAttribute('data-category');
                const index = parseInt(editBtn.getAttribute('data-index'));
                editSong(category, index);
            });
            
            const deleteBtn = songElement.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => {
                const category = deleteBtn.getAttribute('data-category');
                const index = parseInt(deleteBtn.getAttribute('data-index'));
                deleteSong(category, index);
            });
            
            songList.appendChild(songElement);
        });
    } catch (error) {
        console.error('曲リスト表示エラー:', error);
        songList.innerHTML = '<div class="alert alert-danger">曲リストの表示中にエラーが発生しました。</div>';
    }
}

/**
 * HTMLエンティティをエスケープする関数
 * @param {string} unsafe - エスケープ前の文字列
 * @returns {string} エスケープ後の文字列
 */
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * カテゴリの表示名を取得する関数
 * @param {string} category - カテゴリID
 * @returns {string} カテゴリの表示名
 */
function getCategoryDisplayName(category) {
    switch (category) {
        case CATEGORY.JPOP: return 'J-POP';
        case CATEGORY.ANISON: return 'アニソン';
        case CATEGORY.VOCALOID: return 'ボカロ';
        default: 
            // カスタムカテゴリの場合は対応する表示名を返す
            const customCategory = customCategories.find(cat => cat.id === category);
            return customCategory ? customCategory.name : category;
    }
}

/**
 * カテゴリラベルを取得する関数
 * @param {Object} song - 曲オブジェクト
 * @returns {string} カテゴリラベル
 */
function getCategoryLabel(song) {
    if (!song) return '';
    
    for (const [category, songList] of Object.entries(songs)) {
        if (!Array.isArray(songList)) continue;
        
        if (songList.some(s => s && s.title === song.title && s.artist === song.artist)) {
            return getCategoryDisplayName(category);
        }
    }
    return '';
}

/**
 * 曲のカテゴリを取得する関数
 * @param {Object} song - 曲オブジェクト
 * @returns {string|null} カテゴリID、見つからない場合はnull
 */
function getSongCategory(song) {
    if (!song || !song.title) {
        console.warn('無効な曲オブジェクト:', song);
        return null;
    }
    
    try {
        // カテゴリを順番に検索
        for (const [category, songList] of Object.entries(songs)) {
            if (!Array.isArray(songList)) {
                console.warn(`カテゴリが配列ではありません: ${category}`);
                continue;
            }
            
            // 曲名とアーティスト名が一致する曲を検索
            const found = songList.some(s => 
                s && song && 
                s.title === song.title && 
                (
                    // アーティスト名も一致するか、どちらかが未設定
                    (!s.artist && !song.artist) || 
                    (s.artist === song.artist)
                )
            );
            
            if (found) {
                return category;
            }
        }
        
        // 一致する曲が見つからない場合
        console.warn('カテゴリが見つからない曲:', song);
        return null;
    } catch (error) {
        console.error('カテゴリ検索エラー:', error);
        return null;
    }
}

// カテゴリリストを保存する関数
function saveCategoriesToStorage() {
    localStorage.setItem('customCategories', JSON.stringify(customCategories));
}

/**
 * 曲を追加するモーダルを表示する関数
 */
function addSong() {
    modalTitle.textContent = '曲を追加';
    songForm.reset();
    editIndex.value = '';
    songModal.show();
}

/**
 * 曲を編集するモーダルを表示する関数
 * @param {string} category - 曲のカテゴリ
 * @param {number} index - 曲のインデックス
 */
function editSong(category, index) {
    // カテゴリが存在しない場合の対応
    if (!category || category === 'undefined') {
        console.error(`無効なカテゴリ: ${category}`);
        alert('編集する曲のカテゴリが見つかりません。');
        return;
    }
    
    // インデックスが数値でない場合の対応
    const indexNum = parseInt(index);
    if (isNaN(indexNum)) {
        console.error(`無効なインデックス: ${index}`);
        alert('編集する曲のインデックスが無効です。');
        return;
    }
    
    // songsオブジェクトにカテゴリが存在するか確認
    if (!songs[category]) {
        console.error(`カテゴリが存在しません: ${category}`);
        alert('編集する曲のカテゴリが見つかりません。');
        return;
    }
    
    // 曲の取得
    const song = songs[category][indexNum];
    if (!song) {
        console.error(`編集する曲が見つかりません: カテゴリ=${category}, インデックス=${index}`);
        alert('編集する曲が見つかりません。');
        return;
    }
    
    try {
        // モーダルのタイトルを変更
        modalTitle.textContent = '曲を編集';
        
        // フォームに値を設定
        editIndex.value = `${category},${indexNum}`;
        
        // カテゴリセレクトの設定
        if (categorySelect.querySelector(`option[value="${category}"]`)) {
            categorySelect.value = category;
        } else {
            console.warn(`カテゴリの選択肢が見つかりません: ${category}、デフォルトに設定します`);
            categorySelect.value = CATEGORY.JPOP;
        }
        
        titleInput.value = song.title || '';
        artistInput.value = song.artist || '';
        keySelect.value = song.key || '原調';
        youtubeLinkInput.value = song.youtubeLink || '';
        
        // モーダルを表示
        songModal.show();
    } catch (error) {
        console.error('曲の編集フォーム表示エラー:', error);
        alert('曲の編集準備中にエラーが発生しました。');
    }
}

/**
 * 曲を削除する関数
 * @param {string} category - 曲のカテゴリ
 * @param {number} index - 曲のインデックス
 */
function deleteSong(category, index) {
    // カテゴリが存在しない場合の対応
    if (!category || category === 'undefined') {
        console.error(`無効なカテゴリ: ${category}`);
        alert('削除する曲のカテゴリが見つかりません。');
        return;
    }
    
    // インデックスが数値でない場合の対応
    const indexNum = parseInt(index);
    if (isNaN(indexNum)) {
        console.error(`無効なインデックス: ${index}`);
        alert('削除する曲のインデックスが無効です。');
        return;
    }
    
    // songsオブジェクトにカテゴリが存在するか確認
    if (!songs[category]) {
        console.error(`カテゴリが存在しません: ${category}`);
        alert('削除する曲のカテゴリが見つかりません。');
        return;
    }
    
    // 曲の存在確認
    if (!songs[category][indexNum]) {
        console.error(`削除する曲が見つかりません: カテゴリ=${category}, インデックス=${indexNum}`);
        alert('削除する曲が見つかりません。');
        return;
    }
    
    try {
        if (confirm('この曲を削除してもよろしいですか？')) {
            // 曲の情報を保存（お気に入りから削除するため）
            const deletedSong = songs[category][indexNum];
            
            // 曲を削除
            songs[category].splice(indexNum, 1);
            
            // お気に入りからも削除
            if (deletedSong) {
                const favIndex = favorites.findIndex(fav => 
                    fav && deletedSong && fav.title === deletedSong.title && fav.artist === deletedSong.artist
                );
                if (favIndex !== -1) {
                    favorites.splice(favIndex, 1);
                    Storage.saveFavorites(favorites);
                }
            }
            
            // ローカルストレージに保存
            Storage.saveSongs(songs);
            
            // 全てのタブの曲リストを更新
            updateAllSongLists();
        }
    } catch (error) {
        console.error('曲の削除エラー:', error);
        alert('曲の削除中にエラーが発生しました。');
    }
}

/**
 * お気に入りを切り替える関数
 * @param {string} title - 曲のタイトル
 * @param {string} artist - アーティスト名
 */
function toggleFavorite(title, artist) {
    if (!title) return;
    
    const index = favorites.findIndex(fav => 
        fav && fav.title === title && fav.artist === artist
    );

    if (index === -1) {
        // お気に入りに追加
        const song = Object.values(songs).flat().find(s => 
            s && s.title === title && s.artist === artist
        );
        
        if (song) {
            favorites.push(song);
        }
    } else {
        // お気に入りから削除
        favorites.splice(index, 1);
    }

    // ローカルストレージに保存
    Storage.saveFavorites(favorites);

    // 表示を更新
    const activeTab = document.querySelector('.nav-link.active');
    if (activeTab) {
        const currentTab = activeTab.getAttribute('data-bs-target')?.substring(1);
        if (currentTab) {
            displaySongs(currentTab);
        }
    }
    displaySongs(CATEGORY.FAVORITES);
}

/**
 * 曲をローカルストレージに保存する関数
 */
function saveSongsToStorage() {
    Storage.saveSongs(songs);
}

/**
 * 曲を保存する関数
 */
async function saveSong() {
    try {
        const editIndexValue = editIndex.value;
        const category = categorySelect.value;
        const title = titleInput.value.trim();
        const artist = artistInput.value.trim();
        const key = keySelect.value;
        const youtubeLink = youtubeLinkInput.value.trim();

        // 入力検証
        if (!title) {
            alert('曲名は必須です。');
            return;
        }

        if (!category) {
            alert('カテゴリを選択してください。');
            return;
        }

        // カテゴリが存在するか確認
        if (!songs[category]) {
            console.warn(`カテゴリが存在しません: ${category}、新しく作成します`);
            songs[category] = [];
        }

        // YouTubeリンクが入力されている場合、動画IDの形式チェック
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

        if (editIndexValue) {
            // 編集モード
            let [oldCategory, index] = editIndexValue.split(',');
            const indexNum = parseInt(index);
            
            // カテゴリが存在するか確認
            if (!songs[oldCategory]) {
                console.warn(`編集元のカテゴリが存在しません: ${oldCategory}、新規追加として処理します`);
                if (!songs[category]) {
                    songs[category] = [];
                }
                songs[category].push(song);
            }
            // インデックスが有効か確認
            else if (isNaN(indexNum) || indexNum < 0 || indexNum >= songs[oldCategory].length) {
                console.warn(`編集する曲のインデックスが無効です: ${index}、新規追加として処理します`);
                if (!songs[category]) {
                    songs[category] = [];
                }
                songs[category].push(song);
            }
            // カテゴリが変更された場合
            else if (oldCategory !== category) {
                songs[oldCategory].splice(indexNum, 1);
                
                // 新しいカテゴリに曲を追加
                if (!songs[category]) {
                    songs[category] = [];
                }
                songs[category].push(song);
                
                // お気に入りも更新
                updateFavorites(song);
            } 
            // 同じカテゴリ内での編集
            else {
                songs[oldCategory][indexNum] = song;
                
                // お気に入りも更新
                updateFavorites(song);
            }
        } else {
            // 新規追加モード
            if (!songs[category]) {
                songs[category] = [];
            }
            songs[category].push(song);
        }

        // ローカルストレージに保存
        Storage.saveSongs(songs);

        // 曲リストを更新
        updateAllSongLists();

        // モーダルを閉じる
        songModal.hide();

        // フォームをリセット
        songForm.reset();
        editIndex.value = '';
    } catch (error) {
        console.error('曲の保存エラー:', error);
        alert('曲の保存中にエラーが発生しました。');
    }
}

/**
 * お気に入りリストを更新する関数
 * @param {Object} updatedSong - 更新された曲情報
 */
function updateFavorites(updatedSong) {
    if (!updatedSong || !updatedSong.title) return;
    
    try {
        // 元のお気に入りを探す
        const index = favorites.findIndex(fav => 
            fav && fav.title === updatedSong.title && 
            ((!fav.artist && !updatedSong.artist) || fav.artist === updatedSong.artist)
        );
        
        // お気に入りに登録されている場合は情報を更新
        if (index !== -1) {
            favorites[index] = { ...updatedSong };
            Storage.saveFavorites(favorites);
        }
    } catch (error) {
        console.error('お気に入り更新エラー:', error);
    }
}

/**
 * 検索機能
 */
function searchSongs() {
    try {
        const searchQuery = document.getElementById('searchInput').value.trim();
        const activeTab = document.querySelector('.nav-link.active');
        
        if (!activeTab) {
            console.error('アクティブなタブが見つかりません。');
            return;
        }
        
        const currentTab = activeTab.getAttribute('data-bs-target')?.substring(1);
        if (currentTab) {
            displaySongs(currentTab, searchQuery);
        }
    } catch (error) {
        console.error('検索エラー:', error);
    }
}

/**
 * YouTube検索を実行する関数
 * @param {string} query - 検索クエリ
 */
async function searchYouTube(query) {
    if (!query) return;
    
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

/**
 * YouTube検索結果を表示する関数
 * @param {string} searchUrl - 検索URL
 * @param {string} query - 検索クエリ
 */
function displayYouTubeResults(searchUrl, query) {
    if (!youtubeSearchResults) {
        console.error('YouTube検索結果表示要素が見つかりません。');
        return;
    }
    
    const safeQuery = escapeHtml(query);
    const safeSearchUrl = escapeHtml(searchUrl);
    
    youtubeSearchResults.innerHTML = `
        <div class="text-center mb-3">
            <h5>曲が見つかりませんでした</h5>
            <p>YouTubeで「${safeQuery}」を検索します</p>
            <a href="${safeSearchUrl}" target="_blank" class="btn btn-primary mb-3">
                <i class="bi bi-youtube"></i> YouTubeで検索
            </a>
        </div>
        <div class="alert alert-info">
            <i class="bi bi-info-circle"></i> 検索結果から動画を選択し、URLをコピーして「曲を追加」ボタンから追加してください。
        </div>
        <div class="text-center">
            <button class="btn btn-success" id="addSongFromYouTubeBtn">
                <i class="bi bi-plus-circle"></i> 曲を追加
            </button>
        </div>
    `;
    
    // イベントリスナーを追加
    const addButton = document.getElementById('addSongFromYouTubeBtn');
    if (addButton) {
        addButton.addEventListener('click', () => addSongFromYouTube(query, ''));
    }

    youtubeSearchModal.show();
}

/**
 * YouTubeの動画から曲を追加する関数
 * @param {string} query - 検索クエリ
 * @param {string} searchUrl - 検索URL
 */
function addSongFromYouTube(query = '', searchUrl = '') {
    modalTitle.textContent = '曲を追加';
    categorySelect.value = CATEGORY.JPOP; // デフォルトでJ-POPに設定
    titleInput.value = query; // 検索クエリを曲名として設定
    artistInput.value = '';
    keySelect.value = '原調';
    youtubeLinkInput.value = searchUrl; // YouTubeリンクを自動設定
    editIndex.value = '';
    
    youtubeSearchModal.hide();
    songModal.show();
}

/**
 * カスタムカテゴリのタブを作成する関数
 * @param {Object} category - カテゴリオブジェクト
 */
function createCategoryTab(category) {
    if (!category || !category.id || !category.name) {
        console.error('無効なカテゴリオブジェクト:', category);
        return;
    }
    
    const tabsContainer = document.getElementById('songTabs');
    const contentContainer = document.getElementById('songTabsContent');
    
    if (!tabsContainer || !contentContainer) {
        console.error('タブコンテナが見つかりません。');
        return;
    }

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
    
    // タブボタンのコンテンツを作成
    const tabContent = document.createElement('span');
    tabContent.textContent = category.name;
    tabButton.appendChild(tabContent);
    
    // 削除ボタンの作成
    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn-close ms-2';
    deleteButton.setAttribute('type', 'button');
    deleteButton.setAttribute('aria-label', 'カテゴリを削除');
    
    // 削除ボタンのイベントリスナー
    deleteButton.addEventListener('click', (e) => {
        e.stopPropagation(); // タブの切り替えを防止
        deleteCustomCategory(category.id);
    });
    
    tabButton.appendChild(deleteButton);
    
    // タブコンテンツの作成
    const tabContentContainer = document.createElement('div');
    tabContentContainer.className = 'tab-pane fade';
    tabContentContainer.id = category.id;
    tabContentContainer.setAttribute('role', 'tabpanel');
    
    // 曲リスト用のコンテナの作成
    const songListContainer = document.createElement('div');
    songListContainer.className = 'song-list';
    songListContainer.id = `${category.id}List`;
    
    // 要素の追加
    tabItem.appendChild(tabButton);
    tabContentContainer.appendChild(songListContainer);
    
    // お気に入りタブの後に新しいタブを挿入
    const favoritesTab = document.getElementById('favorites-tab');
    if (favoritesTab && favoritesTab.parentElement) {
        const favoritesTabParent = favoritesTab.parentElement;
        const nextTab = favoritesTabParent.nextElementSibling;
        if (nextTab) {
            tabsContainer.insertBefore(tabItem, nextTab);
        } else {
            tabsContainer.appendChild(tabItem);
        }
    } else {
        // お気に入りタブが見つからない場合は最後に追加
        tabsContainer.appendChild(tabItem);
    }
    
    // タブコンテンツの追加
    contentContainer.appendChild(tabContentContainer);
}

/**
 * カスタムカテゴリのセレクトオプションを追加する関数
 * @param {Object} category - カテゴリオブジェクト
 */
function addCategoryToSelect(category) {
    if (!category || !category.id || !category.name || !categorySelect) {
        console.error('無効なカテゴリまたはセレクト要素:', category);
        return;
    }
    
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name;
    categorySelect.appendChild(option);
}

/**
 * 新しいカテゴリを追加する関数
 * @param {string} categoryName - カテゴリ名
 * @returns {boolean} 追加が成功したかどうか
 */
function addNewCategory(categoryName) {
    if (!categoryName || !categoryName.trim()) {
        alert('カテゴリ名を入力してください。');
        return false;
    }
    
    // カテゴリIDを生成（スペースをハイフンに変換し、小文字に）
    const categoryId = `category-${Date.now()}`;
    
    // 新しいカテゴリオブジェクトを作成
    const newCategory = {
        id: categoryId,
        name: categoryName.trim()
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
    Storage.saveCategories(customCategories);
    Storage.saveSongs(songs);
    
    // 新しく追加したカテゴリを選択
    if (categorySelect) {
        categorySelect.value = categoryId;
    }
    
    return true;
}

/**
 * すべてのカスタムカテゴリのタブとセレクトオプションを作成
 */
function initializeCustomCategories() {
    try {
        // 既存のカスタムカテゴリタブをクリア
        document.querySelectorAll('#songTabs [data-category-id]').forEach(tab => {
            tab.remove();
        });
        
        // セレクトボックスのカスタムカテゴリオプションをクリア
        if (categorySelect) {
            document.querySelectorAll(`#categorySelect option:not([value="${CATEGORY.JPOP}"]):not([value="${CATEGORY.ANISON}"]):not([value="${CATEGORY.VOCALOID}"])`).forEach(option => {
                option.remove();
            });
        }
        
        // カスタムカテゴリのタブとセレクトオプションを追加
        customCategories.forEach(category => {
            if (!category || !category.id) return;
            
            createCategoryTab(category);
            addCategoryToSelect(category);
            
            // songs オブジェクトにカテゴリがなければ追加
            if (!songs[category.id]) {
                songs[category.id] = [];
            }
        });
    } catch (error) {
        console.error('カスタムカテゴリの初期化エラー:', error);
    }
}

/**
 * カスタムカテゴリを削除する関数
 * @param {string} categoryId - カテゴリID
 */
function deleteCustomCategory(categoryId) {
    if (!categoryId) return;
    
    if (confirm('このカテゴリを削除してもよろしいですか？\nカテゴリ内の曲もすべて削除されます。')) {
        try {
            // カスタムカテゴリリストから削除
            customCategories = customCategories.filter(cat => cat && cat.id !== categoryId);
            
            // songs オブジェクトから削除
            delete songs[categoryId];
            
            // セレクトボックスから削除
            const option = document.querySelector(`#categorySelect option[value="${categoryId}"]`);
            if (option) {
                option.remove();
            }
            
            // タブを削除
            const tab = document.querySelector(`#songTabs [data-category-id="${categoryId}"]`);
            if (tab) {
                tab.remove();
            }
            
            // タブコンテンツを削除
            const content = document.getElementById(categoryId);
            if (content) {
                content.remove();
            }
            
            // ローカルストレージに保存
            Storage.saveCategories(customCategories);
            Storage.saveSongs(songs);
            
            // 曲リストを更新
            updateAllSongLists();
        } catch (error) {
            console.error('カテゴリ削除エラー:', error);
            alert('カテゴリの削除中にエラーが発生しました。');
        }
    }
}

// 共通関数
/**
 * すべてのタブの曲リストを更新する
 */
function updateAllSongLists() {
    try {
        displaySongs(CATEGORY.ALL);
        displaySongs(CATEGORY.FAVORITES);
        displaySongs(CATEGORY.JPOP);
        displaySongs(CATEGORY.ANISON);
        displaySongs(CATEGORY.VOCALOID);
        customCategories.forEach(category => {
            if (category && category.id) {
                displaySongs(category.id);
            }
        });
    } catch (error) {
        console.error('曲リスト更新エラー:', error);
    }
}

/**
 * イベントリスナーを設定する関数
 */
function setupEventListeners() {
    // 曲追加ボタンのイベントリスナー
    const addSongButton = document.getElementById('addSongButton');
    if (addSongButton) {
        addSongButton.addEventListener('click', addSong);
    }

    // 保存ボタンのイベントリスナー
    const saveSongButton = document.getElementById('saveSongButton');
    if (saveSongButton) {
        saveSongButton.addEventListener('click', saveSong);
    }

    // 検索ボタンのイベントリスナー
    const searchButton = document.getElementById('searchButton');
    if (searchButton) {
        searchButton.addEventListener('click', searchSongs);
    }

    // 検索入力フィールドのEnterキーイベントリスナー
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchSongs();
            }
        });
    }
    
    // 新しいカテゴリ追加ボタンのイベントリスナー
    const addCategoryButton = document.getElementById('addCategoryButton');
    const newCategoryForm = document.getElementById('newCategoryForm');
    const newCategoryInput = document.getElementById('newCategoryInput');
    
    if (addCategoryButton && newCategoryForm && newCategoryInput) {
        addCategoryButton.addEventListener('click', () => {
            newCategoryForm.style.display = 'block';
            addCategoryButton.style.display = 'none';
            newCategoryInput.focus();
        });
    }
    
    // 新しいカテゴリ保存ボタンのイベントリスナー
    const saveNewCategoryButton = document.getElementById('saveNewCategoryButton');
    if (saveNewCategoryButton && newCategoryForm && newCategoryInput && addCategoryButton) {
        saveNewCategoryButton.addEventListener('click', () => {
            const categoryName = newCategoryInput.value.trim();
            if (addNewCategory(categoryName)) {
                newCategoryForm.style.display = 'none';
                addCategoryButton.style.display = 'block';
                newCategoryInput.value = '';
            }
        });
    }
    
    // 新しいカテゴリキャンセルボタンのイベントリスナー
    const cancelNewCategoryButton = document.getElementById('cancelNewCategoryButton');
    if (cancelNewCategoryButton && newCategoryForm && newCategoryInput && addCategoryButton) {
        cancelNewCategoryButton.addEventListener('click', () => {
            newCategoryForm.style.display = 'none';
            addCategoryButton.style.display = 'block';
            newCategoryInput.value = '';
        });
    }
    
    // 新しいカテゴリ入力フィールドのEnterキーイベントリスナー
    if (newCategoryInput && newCategoryForm && addCategoryButton) {
        newCategoryInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const categoryName = newCategoryInput.value.trim();
                if (addNewCategory(categoryName)) {
                    newCategoryForm.style.display = 'none';
                    addCategoryButton.style.display = 'block';
                    newCategoryInput.value = '';
                }
            }
        });
    }
}

/**
 * アプリケーションの初期化関数
 */
function initializeApp() {
    try {
        // データを修復
        repairInvalidData();
        
        // カスタムカテゴリの初期化
        initializeCustomCategories();
        
        // 各カテゴリの曲リストを表示
        updateAllSongLists();
        
        // イベントリスナーの設定
        setupEventListeners();
        
        // デバッグ用のリセットボタンを追加（開発環境のみ）
        addDebugTools();
        
        console.log('アプリケーションが正常に初期化されました。');
    } catch (error) {
        console.error('アプリケーションの初期化エラー:', error);
    }
}

/**
 * データの整合性を修復する関数
 */
function repairInvalidData() {
    try {
        // 無効な曲データを修復
        Object.keys(songs).forEach(category => {
            if (!Array.isArray(songs[category])) {
                console.warn(`カテゴリ ${category} が配列ではありません。空の配列に修復します。`);
                songs[category] = [];
                return;
            }
            
            // 各カテゴリ内の無効な曲を除去
            songs[category] = songs[category].filter(song => 
                song && typeof song === 'object' && song.title
            );
        });
        
        // 無効なお気に入りを修復
        favorites = favorites.filter(song => 
            song && typeof song === 'object' && song.title
        );
        
        // 修復したデータを保存
        Storage.saveSongs(songs);
        Storage.saveFavorites(favorites);
        
        console.log('データの修復が完了しました。');
    } catch (error) {
        console.error('データ修復エラー:', error);
    }
}

/**
 * デバッグツールを追加する関数
 */
function addDebugTools() {
    // デバッグツールのコンテナを作成
    const debugToolsContainer = document.createElement('div');
    debugToolsContainer.className = 'debug-tools';
    debugToolsContainer.style.position = 'fixed';
    debugToolsContainer.style.bottom = '80px';
    debugToolsContainer.style.right = '20px';
    debugToolsContainer.style.zIndex = '1000';
    
    // リセットボタンを作成
    const resetButton = document.createElement('button');
    resetButton.className = 'btn btn-danger btn-sm';
    resetButton.innerHTML = '<i class="bi bi-trash"></i> リセット';
    resetButton.title = 'すべてのデータをリセット';
    resetButton.addEventListener('click', Storage.resetStorage);
    
    debugToolsContainer.appendChild(resetButton);
    document.body.appendChild(debugToolsContainer);
}

// DOMが読み込まれたら初期化を実行
document.addEventListener('DOMContentLoaded', initializeApp); 