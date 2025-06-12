<?php

/**

 Template name: CMS Template

*/
global $post;
get_header();?>

<section class="main_content">

    <?php

     $imageURL = get_the_post_thumbnail_url($post->ID,full );

    if($imageURL) {

        ?>

        <div class="innerBanner">

            <img class="img-responsive" src="<?php echo $imageURL;?>" alt="<?php echo $post->post_title;?>" />

        </div>

        <?php

    }

    ?>

    <div class="container">

        <div class="inner-page inner-cont">

            <div class="row">

                <div class="col-sm-12">
                    <div class="pagetit">
                        <h2><?php echo $post->post_title;?></h2>
                    </div>
                    <div class="content inner-cont">

                        <?php echo nl2br($post->post_content);?>

                    </div>

                </div>

            </div>

        </div>

    </div>

</section>

<?php get_footer(); ?>