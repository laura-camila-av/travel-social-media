$('#bio-text').dblclick(function() {
    $(this).attr('contenteditable', 'true');
    $(this).focus();
    $(this).addClass('bio-editing');
    });


        $('#bio-text').on('blur', function() {
            $(this).attr('contenteditable', 'false');
            $(this).removeClass('bio-editing');
    
        const bioText = $(this).text().trim();
    
        $.ajax({
            url: '/save-bio',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ bio: bioText }),
            success: function() {
                console.log('Bio saved');
            },
            error: function() {
                alert('Failed to save bio, please try again.');
            }
        });
    });

$('#avatar-upload').change(function() {
    const file = this.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    $.ajax({
        url: '/upload-avatar',
        method: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function(response) {
            const newSrc = '/static/uploads/' + response.filename + '?t=' + Date.now();
            if ($('#profile-img').length) {
                $('#profile-img').attr('src', newSrc);
            } else {
                $('.profile-pic-placeholder').replaceWith('<img src="' + newSrc + '" id="profile-img">');
            }
        },
        error: function() {
            alert('Failed to upload photo, please try again.');
        }
    });
});

function collectAndSaveInterests() {
    const interests = [];
    $('#tag-container .tag').each(function() {
        const text = $(this).clone().children().remove().end().text().trim();
        if (text) interests.push(text);
    });

    $.ajax({
        url: '/save-interests',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ interests: interests }),
        success: function() {
            console.log('Interests saved');
        },
        error: function() {
            alert('Failed to save interests, please try again.');
        }
    });
}

$('#tag-container').on('click', '.tag-remove', function() {
    $(this).parent().remove();
    if ($('#tag-container .tag').length < 5 && $('#tag-add').length === 0) {
        $('#tag-container').append('<span class="tag-add" id="tag-add">+ Add interest</span>');
    }
    collectAndSaveInterests();
});

$('#tag-container').on('click', '#tag-add', function() {
    const input = $('<input class="tag-input" maxlength="25" placeholder="interest...">');
    const newTag = $('<span class="tag"></span>').append(input);
    $(this).before(newTag);
    input.focus();

    input.on('keydown', function(e) {
        if (e.key === 'Enter') {
            const val = $(this).val().trim();
            if (val) {
                const removeBtn = $('<span class="tag-remove">✕</span>');
                $(this).replaceWith(val);
                newTag.append(removeBtn);
                if ($('#tag-container .tag').length >= 5) {
                    $('#tag-add').remove();
                }
                collectAndSaveInterests();
            } else {
                newTag.remove();
            }
        }
        if (e.key === 'Escape') {
            newTag.remove();
        }
    });

    input.on('blur', function() {
        const val = $(this).val().trim();
        if (val) {
            const removeBtn = $('<span class="tag-remove">✕</span>');
            $(this).replaceWith(val);
            newTag.append(removeBtn);
            if ($('#tag-container .tag').length >= 5) {
                $('#tag-add').remove();
            }
            collectAndSaveInterests();
        } else {
            newTag.remove();
        }
    });
});