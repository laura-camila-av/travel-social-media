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